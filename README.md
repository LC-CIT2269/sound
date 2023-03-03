# sound
## Introduction
This repo contains a working example (however messy) of the Expo Audio.Sound class (from `expo-av`).
The environment requires react, react-native, expo, and expo-av (and probably more).

## Notes
This example is a bit messy and is not very modular.
There are a number of ideas at play in here including an attempt to make the load and playback fuunctions more generic
If we continute to extend the notion of arbitrarily named state sets for each playback object (pbo) we should probably keep a dictionary of those keys as we add them.

It might be better to create a class called PBO that recalls its own state then we can pass those around more simply. 
This will require more thought, for sure!
