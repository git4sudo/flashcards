import React, { useState, useEffect } from 'react';
import { useFlashcardStore } from '../store/flashcardStore';
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Stack, 
  Switch, 
  FormControlLabel,
  Grid,
  Paper,
  ButtonGroup,
  Container,
  CircularProgress,
  Link
} from '@mui/material';
import { NavigateBefore, NavigateNext, Refresh, Flip } from '@mui/icons-material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const StudyMode: React.FC = () => {
  const {
    flashcards,
    currentIndex,
    isTestMode,
    sessionStats,
    setCurrentIndex,
    updateProgress,
    resetConfidence,
    setTestMode,
    resetSessionStats,
    updateSessionStats,
    fetchFlashcards,
  } = useFlashcardStore();

  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({ front: false, back: false });
  const [testModeHistory, setTestModeHistory] = useState<number[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Preload current card images
  useEffect(() => {
    if (flashcards[currentIndex]) {
      const frontImage = new Image();
      const backImage = new Image();
      
      frontImage.onload = () => setImageLoaded(prev => ({ ...prev, front: true }));
      backImage.onload = () => setImageLoaded(prev => ({ ...prev, back: true }));
      
      // Keep previous images visible while loading new ones
      frontImage.src = flashcards[currentIndex].frontImageUrl;
      backImage.src = flashcards[currentIndex].backImageUrl;
    }
  }, [currentIndex, flashcards]);

  // Reset image loaded state when leaving the page
  useEffect(() => {
    return () => setImageLoaded({ front: false, back: false });
  }, []);

  useEffect(() => {
    const loadFlashcards = async () => {
      setIsLoading(true);
      try {
        await fetchFlashcards();
      } catch (error) {
        console.error('Error loading flashcards:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFlashcards();
  }, [fetchFlashcards]);

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleFlip = () => {
    if (!imageLoaded.back && !isFlipped) return; // Prevent flipping if back image isn't loaded
    setIsFlipped(!isFlipped);
  };

  const handleRate = (confidenceLevel: number) => {
    const isCorrect = confidenceLevel === 3;
    updateProgress(flashcards[currentIndex].id, confidenceLevel, isCorrect);
    updateSessionStats(isCorrect);
  };

  const handleReset = () => {
    resetConfidence();
    resetSessionStats();
  };

  const getRandomCard = () => {
    const weights = flashcards.map(card => {
      const correctRate = card.timesReviewed === 0 ? 0.5 : 
        (card.incorrectAnswers + 1) / (card.timesReviewed + 1);
      return correctRate;
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i;
      }
    }
    return flashcards.length - 1;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!isTestMode) {
      const newIndex = direction === 'prev'
        ? (currentIndex - 1 + flashcards.length) % flashcards.length
        : (currentIndex + 1) % flashcards.length;
      setCurrentIndex(newIndex);
    } else {
      if (direction === 'prev' && historyIndex > 0) {
        // Move back in history
        setHistoryIndex(historyIndex - 1);
        setCurrentIndex(testModeHistory[historyIndex - 1]);
      } else if (direction === 'next') {
        if (historyIndex < testModeHistory.length - 1) {
          // Move forward in existing history
          setHistoryIndex(historyIndex + 1);
          setCurrentIndex(testModeHistory[historyIndex + 1]);
        } else {
          // Generate new random card only when at the end of history
          const newIndex = getRandomCard();
          setTestModeHistory(prev => [...prev, newIndex]);
          setHistoryIndex(prev => prev + 1);
          setCurrentIndex(newIndex);
        }
      }
    }
    setIsFlipped(false);
  };

  const handleCardSelect = (index: number) => {
    setCurrentIndex(index);
    setIsFlipped(false);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Typography variant="h6" align="center" sx={{ mt: 4 }}>
        No flashcards available. Please add images to the Supabase storage buckets.
      </Typography>
    );
  }

  const currentCard = flashcards[currentIndex];
  const cardNumber = currentCard.fileName.replace('.png', '');

  // Sort cards by number
  const sortedCards = [...flashcards].sort((a, b) => {
    const aNum = parseInt(a.fileName.replace('.png', ''));
    const bNum = parseInt(b.fileName.replace('.png', ''));
    return aNum - bNum;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 2, position: 'relative', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          {isTestMode ? 'Test Mode' : 'Study Mode'}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={isTestMode}
                onChange={(e) => setTestMode(e.target.checked)}
              />
            }
            label="Test Mode"
          />
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
          >
            Reset Progress
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Typography>
          Cards Reviewed: {sessionStats.cardsReviewed} | 
          Correct: {sessionStats.correctAnswers} | 
          Current Streak: {sessionStats.currentStreak} | 
          Best Streak: {sessionStats.bestStreak}
        </Typography>
      </Box>

      {/* Card Display */}
      <Card sx={{ mb: 2, minHeight: '500px' }}>
        <CardContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          height: '100%',
          position: 'relative'
        }}>
          {(!isTestMode || (isTestMode && isFlipped)) && (
            <Typography variant="h6" gutterBottom>
              Card {cardNumber}
            </Typography>
          )}
          <Box sx={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: 2,
            flex: 1,
            perspective: '1000px'
          }}>
            <Box sx={{ 
              flex: 1, 
              maxWidth: '800px', 
              height: '400px',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* Front of card */}
              <Box sx={{ 
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.3s ease-in-out',
              }}>
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!imageLoaded.front && (
                    <Box sx={{ 
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      bgcolor: 'background.paper',
                      zIndex: 1,
                    }}>
                      <CircularProgress />
                    </Box>
                  )}
                  <img
                    src={currentCard.frontImageUrl}
                    alt="Front of card"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      opacity: imageLoaded.front ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out',
                    }}
                    onLoad={() => setImageLoaded(prev => ({ ...prev, front: true }))}
                  />
                </Box>
              </Box>

              {/* Back of card */}
              <Box sx={{ 
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.3s ease-in-out',
              }}>
                <Box sx={{ 
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!imageLoaded.back && (
                    <Box sx={{ 
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      bgcolor: 'background.paper',
                      zIndex: 1,
                    }}>
                      <CircularProgress />
                    </Box>
                  )}
                  <img
                    src={currentCard.backImageUrl}
                    alt="Back of card"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      opacity: imageLoaded.back ? 1 : 0,
                      transition: 'opacity 0.3s ease-in-out',
                    }}
                    onLoad={() => setImageLoaded(prev => ({ ...prev, back: true }))}
                  />
                </Box>
              </Box>
            </Box>
            
            {isFlipped && (
              <Box sx={{ 
                width: '200px',
                opacity: isFlipped ? 1 : 0,
                transition: 'opacity 0.3s',
                transitionDelay: '0.3s'
              }}>
                <Typography>
                  Times Reviewed: {currentCard.timesReviewed}
                </Typography>
                <Typography>
                  Correct: {currentCard.correctAnswers}
                </Typography>
                <Typography>
                  Incorrect: {currentCard.incorrectAnswers}
                </Typography>
                <Typography>
                  Confidence: {
                    currentCard.confidenceLevel === 1 ? 'Incorrect' :
                    currentCard.confidenceLevel === 2 ? 'Not Sure' :
                    currentCard.confidenceLevel === 3 ? 'Correct' : 'Not Rated'
                  }
                </Typography>
              </Box>
            )}
          </Box>

          {/* Rating Buttons - Now always visible */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            width: '100%',
            maxWidth: '600px'
          }}>
            {/* Navigation Controls */}
            <ButtonGroup variant="contained" fullWidth>
              <Button
                onClick={() => handleNavigate('prev')}
                startIcon={<NavigateBefore />}
              >
                Previous
              </Button>
              <Button
                onClick={handleFlip}
                startIcon={<Flip />}
                disabled={!imageLoaded.back && !isFlipped}
              >
                Flip
              </Button>
              <Button
                onClick={() => handleNavigate('next')}
                endIcon={<NavigateNext />}
              >
                Next
              </Button>
            </ButtonGroup>

            {/* Rating Buttons */}
            <ButtonGroup variant="contained" fullWidth>
              <Button
                color="error"
                onClick={() => handleRate(1)}
                sx={{ 
                  py: 1.5,
                  bgcolor: currentCard.confidenceLevel === 1 ? 'error.dark' : 'error.main',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon />
                  <Typography>INCORRECT</Typography>
                  <StarBorderIcon />
                </Box>
              </Button>
              <Button
                color="warning"
                onClick={() => handleRate(2)}
                sx={{ 
                  py: 1.5,
                  bgcolor: currentCard.confidenceLevel === 2 ? 'warning.dark' : 'warning.main',
                  '&:hover': { bgcolor: 'warning.dark' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon />
                  <Typography>NOT SURE</Typography>
                  <StarIcon />
                </Box>
              </Button>
              <Button
                color="success"
                onClick={() => handleRate(3)}
                sx={{ 
                  py: 1.5,
                  bgcolor: currentCard.confidenceLevel === 3 ? 'success.dark' : 'success.main',
                  '&:hover': { bgcolor: 'success.dark' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon />
                  <Typography>CORRECT</Typography>
                  <StarIcon />
                </Box>
              </Button>
            </ButtonGroup>
          </Box>
        </CardContent>
      </Card>

      {/* Card Grid - Only show in study mode */}
      {!isTestMode && (
        <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom>
            All Cards
          </Typography>
          <Grid container spacing={0.5}>
            {sortedCards.map((card) => {
              const num = parseInt(card.fileName.replace('.png', ''));
              return (
                <Grid item xs={12/21} key={card.id}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={() => handleCardSelect(flashcards.findIndex(f => f.id === card.id))}
                    sx={{
                      bgcolor: card.id === currentCard.id ? 'primary.main' : 'grey.200',
                      color: card.id === currentCard.id ? 'white' : 'black',
                      '&:hover': {
                        bgcolor: card.id === currentCard.id ? 'primary.dark' : 'grey.300',
                      },
                      minWidth: 0,
                      p: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    {num}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* Footer */}
      <Box sx={{ 
        position: 'relative',
        bottom: 0,
        width: '100%',
        textAlign: 'center',
        py: 2,
        mt: 4
      }}>
        <Typography variant="body2" color="text.secondary">
          Developed by{' '}
          <Link
            href="https://www.linkedin.com/in/shudhanshu-ranjan/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Shudhanshu Ranjan
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default StudyMode;