import React, { useState } from 'react';

import classes from './styles.module.css';

export default function Video({ videoUrl, resetVideo }) {
  return (
    <div className={classes.Video}>
      <div className={classes.container}>
        <video width="250" src={videoUrl} />

        <div className={classes.overlay}>
          <button
            className={classes.deleteButton}
            onClick={resetVideo}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
