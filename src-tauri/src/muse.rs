use std::cell::Cell;
use std::collections::VecDeque;
use std::error::Error;
use std::fmt::Display;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::{fs, thread};

use crate::clone;

#[derive(Debug)]
pub struct NoteDeserializeError(String);
impl Display for NoteDeserializeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "error deserializing note from line: {}", self.0)
    }
}
impl Error for NoteDeserializeError {}


/// `(time, event)`
#[derive(Debug)]
pub struct MuseEvent(pub usize, pub String);
impl MuseEvent {
    pub fn from_str(str: &str) -> Result<Self, NoteDeserializeError> {
        let mut iter = str.trim().split(' ');
        
        let time = 
            iter.next().ok_or(NoteDeserializeError(str.into()))?
            .parse().map_err(|_| NoteDeserializeError(str.into()))?;
        
        let note = iter.next().ok_or(NoteDeserializeError(str.into()))?.to_string();
        
        Ok(Self( time, note ))
    }
}

#[derive(Debug)]
pub struct MuseReader {
    note_events: Arc<Mutex<VecDeque<MuseEvent>>>,
    other_events: Arc<Mutex<VecDeque<MuseEvent>>>,
    playing: Arc<AtomicBool>,
    absolute_start_time: Arc<Mutex<u128>>,
    absolute_pause_time: Arc<Mutex<u128>>,
}
impl MuseReader {
    pub fn new(filepath: &str) -> Result<(Self, String), Box<dyn Error>> {
        
        let mut note_events = VecDeque::new();
        let mut other_events = VecDeque::new();
        
        for line in fs::read_to_string(filepath)?.trim().split('\n') {
            if line.contains(":") {
                note_events.push_back(MuseEvent::from_str(line)?);
            }
            else {
                other_events.push_back(MuseEvent::from_str(line)?);
            }
        }
        
        Ok((
            Self { 
                note_events: Arc::new(Mutex::new(note_events)),
                other_events: Arc::new(Mutex::new(other_events)),
                playing: Arc::new(AtomicBool::new(false)),
                absolute_start_time: Arc::new(Mutex::new(0)),
                absolute_pause_time: Arc::new(Mutex::new(0))
            },
            filepath.to_string()
        ))
    }
    
    pub fn play<S, E>(&self, hitring_duration_ms: usize, on_start: S, mut on_event: E) 
    where 
        S: FnOnce(u128) + Send + 'static,
        E: FnMut(MuseEvent) + Send + 'static, 
    {
        // exit if `playing` was not able to be changed from `false` -> `true`
        if self.playing.compare_exchange(false, true, Ordering::Relaxed, Ordering::Relaxed).is_err() {
            println!("`playing` was not able to be changed from `false` -> `true` ", );
            return
        }
        
        let note_events = Arc::clone(&self.note_events);
        let other_events = Arc::clone(&self.other_events);
        let playing = Arc::clone(&self.playing);
        let absolute_start_time = Arc::clone(&self.absolute_start_time);
        let absolute_pause_time = Arc::clone(&self.absolute_pause_time);
        println!("{note_events:?}", );
        println!("{other_events:?}", );
        
        thread::spawn(move || {
            let mut note_events = note_events.lock().unwrap();
            let mut other_events = other_events.lock().unwrap();
            
            {
                let mut absolute_start_time = absolute_start_time.lock().unwrap();
                let mut absolute_pause_time = absolute_pause_time.lock().unwrap();
                let now = now();
                
                // add pause duration, if exists, to start time
                if *absolute_pause_time != 0 {
                    *absolute_start_time += now - *absolute_pause_time;
                    println!("shifting start time by {}", now - *absolute_pause_time);
                    *absolute_pause_time = 0;
                }
                
                // if starting song for first time
                else if *absolute_start_time == 0 {
                    *absolute_start_time = now;
                }
                
                on_start(*absolute_start_time);
            }
            
            while !note_events.is_empty() || !other_events.is_empty() {
                if !playing.load(Ordering::Relaxed) { return println!("paused so exiting loop") }
                
                let now = now();
                
                let absolute_start_time = *absolute_start_time.lock().unwrap();
                
                while let Some(MuseEvent(time, _)) = note_events.front() {
                    if now >= (*time - hitring_duration_ms) as u128 + absolute_start_time {
                        on_event(note_events.pop_front().unwrap());
                    }
                    else { break }
                }
                
                while let Some(MuseEvent(time, _)) = other_events.front() {
                    if now >= *time as u128 + absolute_start_time {
                        on_event(other_events.pop_front().unwrap());
                    }
                    else { break }
                }
            }
            
            // after all events are done
            println!("all events done, resetting abs. start time", );
            playing.store(false, Ordering::Relaxed);
            *absolute_start_time.lock().unwrap() = 0;
        });
    }
    
    pub fn pause(&self) {
        // exit if `playing` was not able to be changed from `true` -> `false`
        if self.playing.compare_exchange(true, false, Ordering::Relaxed, Ordering::Relaxed).is_err() {
            return
        }
        
        *self.absolute_pause_time.lock().unwrap() = now();
    }
}
impl Drop for MuseReader {
    fn drop(&mut self) {
        self.playing.store(false, Ordering::Relaxed);
    }
}

fn now() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()
}