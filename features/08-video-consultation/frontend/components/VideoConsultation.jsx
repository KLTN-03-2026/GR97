import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { initiateVideoCall, endVideoCall } from '../../lib/api';

const VideoConsultation = () => {
    const { consultationId } = useParams();
    const [isCallActive, setIsCallActive] = useState(false);
    const [videoStream, setVideoStream] = useState(null);

    useEffect(() => {
        const startCall = async () => {
            const stream = await initiateVideoCall(consultationId);
            setVideoStream(stream);
            setIsCallActive(true);
        };

        startCall();

        return () => {
            if (isCallActive) {
                endVideoCall(consultationId);
            }
        };
    }, [consultationId, isCallActive]);

    return (
        <div className="video-consultation">
            {isCallActive ? (
                <video autoPlay ref={video => video && (video.srcObject = videoStream)} />
            ) : (
                <p>Starting video consultation...</p>
            )}
            <button onClick={() => endVideoCall(consultationId)}>End Call</button>
        </div>
    );
};

export default VideoConsultation;