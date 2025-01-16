'use client'
import React, { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from 'framer-motion'

interface VideoState {
  isLoading: boolean;
  error: string | null;
  videos: string[];
}

const VideoSkeleton = () => (
  <div className="flex-[0_0_100%] min-w-0 px-4">
    <div className="aspect-video">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  </div>
)

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (
        iframe: HTMLIFrameElement,
        options: {
          events: {
            onStateChange: (event: { data: number }) => void;
          };
        }
      ) => void;
      PlayerState: {
        PLAYING: number;
      };
    };
  }
}

let autoplay: NodeJS.Timeout;

export function VideoCarousel() {
  const [state, setState] = useState<VideoState>({
    isLoading: true,
    error: null,
    videos: []
  })
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    duration: 20,
    skipSnaps: false
  })

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = async () => {
      return new Promise<void>((resolve) => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API Ready');
          resolve();
        };
      });
    };

    const checkAuthAndFetchVideos = async () => {
      try {
        // Load YouTube API first
        await loadYouTubeAPI();
        
        // Make a test request to check if we're authenticated
        const testResponse = await fetch('/api/youtube');
        if (testResponse.status === 401) {
          // If not authenticated, wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 500));
          return checkAuthAndFetchVideos();
        }
        
        if (!testResponse.ok) {
          throw new Error(`HTTP error! status: ${testResponse.status}`);
        }
        
        const data = await testResponse.json();
        const uniqueVideos = data.videos.map((video: { id: string }) => video.id)
        setState(prev => ({
          ...prev,
          isLoading: false,
          videos: uniqueVideos
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load videos. Please try again later.'
        }));
        console.error('Error fetching videos:', error);
      }
    }
    checkAuthAndFetchVideos();
  }, []);

  useEffect(() => {
    if (emblaApi && !isVideoPlaying) {
      autoplay = setInterval(() => {
        console.log('Video is not playing, scrolling next');
        emblaApi.scrollNext();
      }, 5000)

      return () => clearInterval(autoplay)
    }
  }, [emblaApi, isVideoPlaying])

  const onPlayerStateChange = (event: { data: number }) => {
    // YT.PlayerState.PLAYING === 1
    if (event.data === 1) {
      clearInterval(autoplay);
    }
    setIsVideoPlaying(event.data === 1);
  };

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <>
          <VideoSkeleton />
          <VideoSkeleton />
          <VideoSkeleton />
        </>
      );
    }

    if (state.error) {
      return (
        <div className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center h-[300px]">
          <p className="text-red-500">{state.error}</p>
        </div>
      );
    }

    return state.videos.map((videoId) => (
      <div key={videoId} className="flex-[0_0_100%] min-w-0 px-2 md:px-4">
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&controls=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded-lg"
            loading="lazy"
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              new window.YT.Player(iframe, {
                events: {
                  onStateChange: onPlayerStateChange,
                },
              });
            }}
          ></iframe>
        </div>
      </div>
    ));
  }

  return (
    <Card className="w-full p-3 md:p-8 border-2 border-primary/20">
      <CardContent className="px-0 md:p-8 max-w-[1600px] mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-primary decorative-border">
          वीडियो गैलरी
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full max-w-[1400px] mx-auto"
        >
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {renderContent()}
            </div>
          </div>
          {!state.isLoading && !state.error && state.videos.length > 0 && !isVideoPlaying && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 -left-2 md:left-8 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={scrollPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 -right-2 md:right-8 -translate-y-1/2 z-10 bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={scrollNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}

