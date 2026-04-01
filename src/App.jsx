import React, { useEffect, useState } from 'react';

import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { videoDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';
import { NumericFormat } from 'react-number-format';

import Video from './components/Video';

import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoName, setVideoName] = useState(null);
  const [targetVideoSize, setTargetVideoSize] = useState(26);
  const [outputVideoPath, setOutputVideoPath] = useState(null);
  const [isSuccess, setIsSuccess] = useState(null);
  const [selectedVideoPath, setSelectedVideoPath] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    videoDir().then((dir) => {
      setOutputVideoPath(dir);
    });
  }, []);

  const resetVideo = () => {
    setVideoUrl(null);
    setVideoName(null);
  };

  async function selectOutputVideoPath() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected) {
        console.log(selected);
        setOutputVideoPath(selected);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert(String(error));
    }
  }

  async function compressVideo() {
    try {
      setIsProcessing(true);
      await invoke('resize_video', {
        path: selectedVideoPath,
        targetSize: parseFloat(targetVideoSize),
        outputPath: outputVideoPath,
      });
      resetVideo();
      setIsSuccess(true);
    } catch (error) {
      console.error('Error compressing video:', error);
      alert(String(error));
    } finally {
      setIsProcessing(false);
    }
  }

  async function selectVideo() {
    console.log('button clicked');
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [
          {
            name: 'Videos',
            extensions: ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'],
          },
        ],
      });

      if (selected) {
        setVideoName(selected.split('\\').pop());
        setVideoUrl(convertFileSrc(selected));
        setSelectedVideoPath(selected);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert(String(error));
    }
  }

  return (
    <main className="container">
      <h1>Video Compressor</h1>

      <div className="row">
        <button type="button" onClick={selectVideo}>
          Select Video
        </button>
        <NumericFormat
          value={targetVideoSize}
          onValueChange={(values) => {
            setTargetVideoSize(values.floatValue);
          }}
          suffix=" MB"
          allowNegative={false}
        />
      </div>
      <div>
        {videoUrl && !isSuccess && !isProcessing && (
          <div>
            <Video videoUrl={videoUrl} resetVideo={resetVideo} />
            <p>{videoName}</p>
            <button type="button" onClick={compressVideo}>
              Compress
            </button>
          </div>
        )}
        {isSuccess && !videoName && <p>Video compressed successfully!</p>}
        {isProcessing && <p>Processing...</p>}
      </div>
      <div>
        <button type="button" onClick={selectOutputVideoPath}>
          Select Output Folder
        </button>
        {outputVideoPath && <p>Output Folder: {outputVideoPath}</p>}
      </div>
    </main>
  );
}

export default App;
