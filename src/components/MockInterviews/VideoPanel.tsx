import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {   Mic, MicOff, Monitor, PhoneOff, Camera, CameraOff, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

type VideoPanelProps = {
  interviewId: string;
  isInterviewer: boolean;
  userId: string;
};

const VideoPanel = ({ interviewId, isInterviewer, userId }: VideoPanelProps) => {
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareAllowed, setIsScreenShareAllowed] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

   useEffect(() => {
     const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        toast({
          title: "Media access granted",
          description: "Camera and microphone are now active",
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Media access denied",
          description: "Please enable camera and microphone access in your browser settings",
          variant: "destructive"
        });
      }
    };
    
    initializeMedia();
    
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

   useEffect(() => {
    if (!localStream) return; 
    
    let pc: RTCPeerConnection | null = null;
    let channel: any = null;

    const setupPeerConnection = async () => {
      setIsConnecting(true);
      
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
 
        ],
        iceCandidatePoolSize: 10
      });
      peerConnection.current = pc;

       localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

       if (isInterviewer) {
        const dataChannel = pc.createDataChannel('controls');
        dataChannelRef.current = dataChannel;
        
        dataChannel.onopen = () => {
          console.log("Data channel opened");
        };
        
        dataChannel.onmessage = (event) => {
          handleDataChannelMessage(event.data);
        };
      } else {
        pc.ondatachannel = (event) => {
          const dataChannel = event.channel;
          dataChannelRef.current = dataChannel;
          
          dataChannel.onopen = () => {
            console.log("Data channel opened");
          };
          
          dataChannel.onmessage = (event) => {
            handleDataChannelMessage(event.data);
          };
        };
      }

       pc.onicecandidate = (event) => {
        if (event.candidate) {
           channelRef.current.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'ice-candidate',
              candidate: event.candidate,
              userId: userId
            }
          });
        }
      };

      pc.onicecandidateerror = (event) => {
        console.error("ICE candidate error:", event);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc?.iceConnectionState);
      };

       pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc?.connectionState);
        if (pc?.connectionState === 'connected') {
          setIsConnecting(false);
          setIsConnected(true);
          toast({
            title: "Connected",
            description: "You are now connected to the other participant",
          });
        } else if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed') {
          setIsConnected(false);
          toast({
            title: "Disconnected",
            description: "Connection to the other participant was lost",
            variant: "destructive"
          });
        }
      };

       pc.ontrack = (event) => {
        console.log("Received remote track", event.streams[0]);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

       channel = supabase.channel(`interview-rtc-${interviewId}`);
      channelRef.current = channel;

      channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!pc || payload.userId === userId) return;
        
        console.log("Received signal:", payload.type);
        
        try {
          if (payload.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            
             const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: {
                type: 'answer',
                sdp: pc.localDescription,
                userId: userId
              }
            });
          } 
          else if (payload.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } 
          else if (payload.type === 'ice-candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch (error) {
          console.error("Error handling signal:", error);
        }
      });

      await channel.subscribe((status) => {
        console.log("Channel status:", status);
        
         if (status === 'SUBSCRIBED' && isInterviewer) {
           setTimeout(startCall, 2000);
        }
      });
    };

    const startCall = async () => {
      if (!peerConnection.current) return;
      
      try {
         const offer = await peerConnection.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await peerConnection.current.setLocalDescription(offer);
        
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'offer',
            sdp: peerConnection.current.localDescription,
            userId: userId
          }
        });
      } catch (error) {
        console.error("Error creating offer:", error);
        toast({
          title: "Connection Error",
          description: "Failed to initiate call. Please try again.",
          variant: "destructive"
        });
      }
    };

    setupPeerConnection();

     return () => {
      localStream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
      pc?.close();
      channel?.unsubscribe();
    };
  }, [interviewId, isInterviewer, userId, localStream]);

  const handleDataChannelMessage = (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'screen-share-status') {
        setIsScreenShareAllowed(data.isAllowed);
      }
    } catch (error) {
      console.error("Error parsing data channel message:", error);
    }
  };

  const sendDataChannelMessage = (message: any) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(message));
    } else {
      console.warn("Data channel not open, cannot send message");
    }
  };

  const toggleCamera = async () => {
    try {
      if (isCameraOn) {
         if (localStream) {
          const videoTracks = localStream.getVideoTracks();
          videoTracks.forEach(track => {
            track.enabled = false;
            track.stop();
          });
          
           if (peerConnection.current) {
            const senders = peerConnection.current.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'video' && !sender.track.label.includes('screen')) {
                peerConnection.current?.removeTrack(sender);
              }
            });
          }
        }
        
        setIsCameraOn(false);
        toast({
          title: "Camera off",
          description: "Your camera has been turned off",
        });
      } else {
         try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          
           if (localStream) {
            const newStream = new MediaStream();
            
             if (isMicOn) {
              localStream.getAudioTracks().forEach(track => {
                newStream.addTrack(track);
              });
            }
            
            newStream.addTrack(videoTrack);
            setLocalStream(newStream);
            
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = newStream;
            }
          } else {
            setLocalStream(videoStream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = videoStream;
            }
          }
          
           if (peerConnection.current) {
            peerConnection.current.addTrack(videoTrack, videoStream);
          }
          
          setIsCameraOn(true);
          toast({
            title: "Camera on",
            description: "Your camera has been turned on",
          });
        } catch (error) {
          console.error("Error accessing camera:", error);
          toast({
            title: "Camera Error",
            description: "Could not access your camera. Please check permissions.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      toast({
        title: "Camera Error",
        description: "An error occurred while toggling camera",
        variant: "destructive",
      });
    }
  };

  const toggleMic = async () => {
    try {
      if (isMicOn) {
         if (localStream) {
          const audioTracks = localStream.getAudioTracks();
          audioTracks.forEach(track => {
            track.enabled = false;
            track.stop();
          });
          
           if (peerConnection.current) {
            const senders = peerConnection.current.getSenders();
            senders.forEach(sender => {
              if (sender.track?.kind === 'audio') {
                peerConnection.current?.removeTrack(sender);
              }
            });
          }
        }
        
        setIsMicOn(false);
        toast({
          title: "Microphone off",
          description: "Your microphone has been muted",
        });
      } else {
         try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          
           if (localStream) {
            const newStream = new MediaStream();
            
             if (isCameraOn) {
              localStream.getVideoTracks().forEach(track => {
                newStream.addTrack(track);
              });
            }
            
            newStream.addTrack(audioTrack);
            setLocalStream(newStream);
          } else {
            setLocalStream(audioStream);
          }
          
           if (peerConnection.current) {
            peerConnection.current.addTrack(audioTrack, audioStream);
          }
          
          setIsMicOn(true);
          toast({
            title: "Microphone on",
            description: "Your microphone has been unmuted",
          });
        } catch (error) {
          console.error("Error accessing microphone:", error);
          toast({
            title: "Microphone Error",
            description: "Could not access your microphone. Please check permissions.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
      toast({
        title: "Microphone Error",
        description: "An error occurred while toggling microphone",
        variant: "destructive",
      });
    }
  };

  const toggleScreenShare = async () => {
  if (isScreenSharing) {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    setScreenStream(null);

    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const screenSender = senders.find(sender =>
        sender.track?.kind === 'video' && sender.track.label.includes('screen')
      );
      if (screenSender) {
        peerConnection.current.removeTrack(screenSender);
      }

       const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      channelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'offer',
          sdp: peerConnection.current.localDescription,
          userId: userId
        }
      });
    }

    setIsScreenSharing(false);
    sendDataChannelMessage({ type: 'screen-share-status', isAllowed: true });

    toast({
      title: "Screen sharing stopped",
      description: "You have stopped sharing your screen",
    });
  } else {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'window',
        },
      });

      setScreenStream(stream);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      if (peerConnection.current) {
        const screenTrack = stream.getVideoTracks()[0];
        peerConnection.current.addTrack(screenTrack, stream);

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        // 🔁 Renegotiate after adding screen share
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        channelRef.current.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'offer',
            sdp: peerConnection.current.localDescription,
            userId: userId
          }
        });
      }

      setIsScreenSharing(true);
      sendDataChannelMessage({ type: 'screen-share-status', isAllowed: false });

      toast({
        title: "Screen sharing started",
        description: "You are now sharing your screen",
      });
    } catch (error) {
      console.error("Error sharing screen:", error);
      toast({
        title: "Screen Sharing Error",
        description: "Could not share your screen. Please check permissions.",
        variant: "destructive",
      });
    }
  }
};


  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Video Call</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
        {isConnecting && !isConnected && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connecting to the other participant...</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
           <div className="w-full relative">
            <video 
              ref={localVideoRef}
              autoPlay 
              muted 
              playsInline
              className={`w-full h-48 rounded-md ${isCameraOn ? 'bg-black' : 'bg-muted'}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-center">Camera off</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
              You {isMicOn ? '(Mic on)' : '(Mic off)'}
            </div>
          </div>
          
          {/* Remote video */}
          <div className="w-full relative">
            <video 
              ref={remoteVideoRef}
              autoPlay 
              playsInline
              className="w-full h-48 rounded-md bg-muted"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Waiting for the other participant to join
                </p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
              {isInterviewer ? 'Interviewee' : 'Interviewer'}
            </div>
          </div>
        </div>
        
        {/* Screen share section */}
        {isScreenSharing && screenStream && (
          <div className="w-full relative">
            <video 
              ref={screenVideoRef}
              autoPlay 
              playsInline
              className="w-full h-48 rounded-md bg-muted"
            />
            <div className="absolute bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
              Screen Share
            </div>
          </div>
        )}
        
        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant={isCameraOn ? "default" : "secondary"}
            size="sm"
            onClick={toggleCamera}
            className="flex items-center gap-1"
          >
            {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            {isCameraOn ? "Camera On" : "Camera Off"}
          </Button>
          
          <Button
            variant={isMicOn ? "default" : "secondary"}
            size="sm"
            onClick={toggleMic}
            className="flex items-center gap-1"
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {isMicOn ? "Mic On" : "Mic Off"}
          </Button>
          
          <Button
            variant={isScreenSharing ? "destructive" : "outline"}
            size="sm"
            onClick={toggleScreenShare}
            disabled={!isScreenShareAllowed && !isScreenSharing}
            className="flex items-center gap-1"
          >
            {isScreenSharing ? <StopCircle className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            {isScreenSharing ? "Stop Sharing" : "Share Screen"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPanel;
