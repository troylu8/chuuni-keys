use std::collections::VecDeque;
use std::error::Error;
use std::fmt::Display;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::{fs, thread};

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
    events: Arc<Mutex<VecDeque<MuseEvent>>>,
    playing: Arc<AtomicBool>,
}
impl MuseReader {
    pub fn new(filepath: &str) -> Result<Self, Box<dyn Error>> {
        
        let mut notes = VecDeque::new();
        
        for line in fs::read_to_string(filepath)?.trim().split('\n') {
            notes.push_back(MuseEvent::from_str(line)?);
        }
        
        println!("{:?}", notes);
        
        Ok(
            Self { 
                events: Arc::new(Mutex::new(notes)),
                playing: Arc::new(AtomicBool::new(false))
            }
        )
    }
    
    pub fn play<F: Fn(MuseEvent) + Send + Sync + 'static>(&self, hitring_duration: usize, on_hitring_start: F) {
        
        // exit if `playing` was not able to be changed from `false` -> `true`
        if self.playing.compare_exchange(false, true, Ordering::Relaxed, Ordering::Relaxed).is_err() {
            return
        }
        
        let playing = Arc::clone(&self.playing);
        let notes = Arc::clone(&self.events);
        
        thread::spawn(move || {
            let mut notes = notes.lock().unwrap();
            
            while playing.load(Ordering::Relaxed) && !notes.is_empty() {
                
                // TODO hitring duration, resume from time we left off, send start song event to front
                
                on_hitring_start(notes.pop_front().unwrap());
                thread::sleep(Duration::from_millis(500));
            }
            
            playing.store(false, Ordering::Relaxed);
        });
    }
    
    pub fn pause(&self) {
        self.playing.store(false, Ordering::Relaxed);
    }
}
impl Drop for MuseReader {
    fn drop(&mut self) {
        self.playing.store(false, Ordering::Relaxed);
    }
}