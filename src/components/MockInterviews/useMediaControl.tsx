
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const useMediaControl = () => {
  const { toast } = useToast();
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState<boolean>(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  
  const toggleCamera = useCallback(async () => {
    try {
      if (cameraEnabled) {
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }
        setCameraEnabled(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        localStreamRef.current = stream;
        
        setCameraEnabled(true);
        toast({
          title: "Camera enabled",
          description: "Your camera is now active.",
        });
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [cameraEnabled, toast]);
  
  const toggleMicrophone = useCallback(async () => {
    try {
      if (micEnabled) {
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => track.stop());
        }
        setMicEnabled(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          
          const combinedStream = new MediaStream([videoTrack, audioTrack]);
          localStreamRef.current = combinedStream;
        } else {
          localStreamRef.current = stream;
        }
        
        setMicEnabled(true);
        toast({
          title: "Microphone enabled",
          description: "Your microphone is now active.",
        });
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [micEnabled, toast]);
  
  const toggleScreenShare = useCallback(async () => {
    try {
      if (screenShareEnabled) {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setScreenShareEnabled(false);
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        
        // Listen for when user stops screen share using the browser controls
        stream.getVideoTracks()[0].onended = () => {
          setScreenShareEnabled(false);
        };
        
        setScreenShareEnabled(true);
        toast({
          title: "Screen sharing enabled",
          description: "You are now sharing your screen.",
        });
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast({
        title: "Screen sharing error",
        description: "Could not share your screen. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [screenShareEnabled, toast]);

  return {
    cameraEnabled,
    micEnabled,
    screenShareEnabled,
    localStreamRef,
    screenStreamRef,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare
  };
};
