// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::io::Error;
use std::process::Command;
use std::{fs, str};

fn get_video_duration(path: &str) -> Result<f64, Error> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            path,
        ])
        .output()?;

    if !output.status.success() {
        return Err(Error::other("Failed to get video duration using ffprobe"));
    }

    let stdout = str::from_utf8(&output.stdout)
        .map_err(|e| Error::other(format!("Failed to parse ffprobe output as UTF-8, {}", e)))?
        .trim();

    if stdout.is_empty() {
        return Err(Error::other("No duration returned from ffprobe"));
    }

    stdout
        .parse::<f64>()
        .map_err(|e| Error::other(e.to_string()))
}

fn get_file_size(path: &str) -> Result<u64, Error> {
    let metadata = fs::metadata(path)?;
    Ok(metadata.len())
}

/* fn call_ffmpeg(path: &str, bitrate: &f64, audio_bitrate: &f64) {
    let bitrate_str = format!("{}k", bitrate.round());
    let audio_bitrate_str = format!("{}", audio_bitrate.round());
    let buffsize_str = format!("{}k", bitrate.round() * 2.0);

    let output = Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            path,
            "-c:v",
            "libx264",
            "-b:v",
            &bitrate_str,
            "-minrate",
            &bitrate_str,
            "-maxrate",
            &bitrate_str,
            "-bufsize",
            &buffsize_str,
            "-c:a",
            "aac",
            "-b:a",
            &audio_bitrate_str,
            "E:/output.mp4",
        ])
        .output()
        .expect("Failed to run ffmpeg");

    println!("{:#?}", output.status)
} */

fn create_filename(path: &str) -> Result<String, Error> {
    let file_stem = std::path::Path::new(path)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or(Error::other("Failed to extract file stem from path"))?;

    Ok(format!("{}_compressed.mp4", file_stem))
}

fn call_ffmpeg(
    path: &str,
    bitrate: &f64,
    audio_bitrate: &f64,
    output_path: &str,
) -> Result<(), Error> {
    let bitrate_str = format!("{}k", bitrate.round());
    let audio_bitrate_str = format!("{}", audio_bitrate.round());

    let passlog = "ffmpeg2pass";

    let first_pass = Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            path,
            "-c:v",
            "libx264",
            "-b:v",
            &bitrate_str,
            "-pass",
            "1",
            "-passlogfile",
            passlog,
            "-an",
            "-f",
            "null",
            "NUL",
        ])
        .output()?;

    println!("{:#?}", first_pass.status);

    if !first_pass.status.success() {
        return Err(Error::other("First pass of ffmpeg failed"));
    }

    let second_pass = Command::new("ffmpeg")
        .args([
            "-y",
            "-i",
            path,
            "-c:v",
            "libx264",
            "-b:v",
            &bitrate_str,
            "-pass",
            "2",
            "-passlogfile",
            passlog,
            "-c:a",
            "aac",
            "-b:a",
            &audio_bitrate_str,
            output_path,
        ])
        .output()?;

    // Clean up pass log files
    let _ = fs::remove_file(format!("{}-0.log", passlog));
    let _ = fs::remove_file(format!("{}-0.log.mbtree", passlog));

    println!("{:#?}", second_pass.status);

    Ok(())
}

#[tauri::command]
fn resize_video(path: &str, target_size: f64, output_path: &str) -> Result<(), String> {
    let target_size_bytes = target_size * 1024.0 * 1024.0 * 0.97; // 97% of the target size to account for overhead

    let duration = match get_video_duration(path) {
        Ok(dur) => dur,
        Err(e) => return Err(format!("Error getting video duration: {}", e)),
    };

    let audio_bitrate = 128.0 * 1000.0;
    let audio_size = (audio_bitrate * duration) / 8.0;
    let final_video_size = target_size_bytes - audio_size;

    let bitrate = (final_video_size * 8.0 / 1000.0) / duration;

    let filename = match create_filename(path) {
        Ok(name) => name,
        Err(e) => return Err(format!("Error creating output filename: {}", e)),
    };
    let full_output_path = format!("{}\\{}", &output_path, filename);

    println!("Duration: {duration}, bitrate: {bitrate}, target file_size: {target_size_bytes}, filepath: {full_output_path}");

    let result = call_ffmpeg(&path, &bitrate, &audio_bitrate, &full_output_path);

    match result {
        Ok(_) => println!("Video resized successfully"),
        Err(e) => return Err(format!("Error resizing video: {}", e)),
    }

    let final_size = match get_file_size(&full_output_path) {
        Ok(size) => size,
        Err(e) => return Err(format!("Error getting final video size: {}", e)),
    };

    if final_size as f64 > target_size * 1024.0 * 1024.0 {
        println!(
            "Final file size is larger than target size ({}). Final size: {} MB",
            target_size,
            final_size as f64 / (1024.0 * 1024.0)
        );
    } else {
        println!(
            "Final file size is within target size. Final size: {} MB",
            final_size as f64 / (1024.0 * 1024.0)
        );
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![resize_video])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
