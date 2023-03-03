/**
\file App.js
\author	Stephen Graham
\date 	2022-03-10
\brief	Sample sound effect player
		https://snack.expo.dev/@kartikeyvaish/remote-and-local-sounds
		https://morioh.com/p/ed71cad8a8c9
		https://docs.expo.dev/versions/latest/sdk/av/
		https://docs.expo.dev/versions/latest/sdk/audio/
		
**/
import React, { Component } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

/**
 * class App
 * This is the main App for the example sound effect player
 **/
export default class App extends Component {
  constructor(props){
	  super(props);
	  this.state = {
		  localSound: null,
		  remoteSound: null,
		  remotePaused: false,
		  remoteSoundPlaying: false,
		  recording: null,
	  }
  }
  // state handlers
	// superceded by setSound
	setLocalSound(newPbo){
		this.setState({
			localSound: newPbo,
		});
	}

	// superceded by setSound
	setRemoteSound(newPbo) {
		this.setState({ 
			remoteSound: newPbo
		});
	}

	// This is a generic state setter for my sounds
	// It will create (or overwrite) a pbo, and a related Playing and Paused flag
	// param   pboName    - string value that will be the root key for the pbo
	// param   pbo        - Audio.Sound object for playback
	setSound = (pboName, pbo) => {
		updateState = {};
		updateState[pboName] = pbo;
		updateState[pboName + "Playing"] = false;
		updateState[pboName + "Paused"] = false;
		this.setState(updateState);
    }


	// This is a general sound loader that will attempt to load a sound and then set the keys for that sound
	// param id - string for the root key name for the state
	// param source - string for the uri of the sound. This can be a local or remote uri
	loadSound = async (id, source) => {
		if (source && id) {
			try {
				const { sound } = await Audio.Sound.createAsync({
					uri: source,
				});
				this.setSound(id, sound);
			} catch (err) {
				console.error("Unable to load sound from uri: ", err);
			}
		} else {
			throw ("Missing source or id.");
		}
	}

	// This function loads a sound from a local, fixed asset using the require(). 
	loadLocalSound = async (source) => {
		try {
			const { sound } = await Audio.Sound.createAsync(
				require("./assets/sfx/sound3.mp3")
			);
			this.setSound("localSound", sound);
		} catch (err) {
			console.error("unable to load local sound.");
		}
	}

	// This is a wrapper function that calls this.loadSound to attach the source to a state key "remoteSound"
	loadRemoteSound = async (source) => {
		try {
			console.log("Attempting to load from ", source);
			await this.loadSound("remoteSound", source);
		} catch (err) {
			console.error("Error in 'loadRemoteSound()': ", err);
		}
	}

	// component lifecycle functions
	async componentDidMount(){
		try {
			await Audio.setAudioModeAsync({ playInSilentModeIOS: true });
			await this.loadLocalSound();
			await this.loadSound('remoteSound', 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3')
		} catch (err) {
			console.error('Error in componentDidMount(): ', err);
        }
	}

	async componentWillUnmount() {
		const { localSound, remoteSound } = this.state;
		if (localSound) {
			localSound.stopAsync();
			localSound.unloadAsync();
		}
		if (remoteSound) {
			remoteSound.stopAsync();
			remoteSound.unloadAsync();
		}
	}
  
	playLocalSound = async () => {
		const { localSound } = this.state;
		try {
			await localSound.replayAsync();
		} catch (err) {
			console.error("Error in playLocalSound(): ", err);
        }
	}

	playSoundFromPboKey = async (pboKey) => {
		const { [pboKey]: localSound } = this.state;
		try {
			await localSound.replayAsync();
		} catch (err) {
			console.error("Cannot replay this pbo (", pboKey, "): ", err);
		}
	}

	playRemoteSound = async () => {
		const { remoteSound, remoteSoundPaused, remoteSoundPlaying } = this.state;
		try {
			if (!remoteSoundPlaying) {
				console.log('Playing Remote Sound');
				await remoteSound.replayAsync();
			}
			else {
				console.log('Stopping Remote Sound');
				//await remoteSound.stopAsync();
				await remoteSound.setStatusAsync({shouldPlay: false,})
				//await remoteSound.setStatusAsync({positionMillis: 0, })
			}
			this.setState({ remoteSoundPlaying: !remoteSoundPlaying, remoteSoundPaused: false });
		} catch (err) {
			console.log("Error during remote play/stop: " + err);
        }
	}

	pauseRemoteSound = async () => {
		const { remoteSound, remotePaused } = this.state
		if (!remotePaused) {
			await remoteSound.pauseAsync()
		} else {
			await remoteSound.playAsync()
		}
		this.setState({ remotePaused: !remotePaused });
	}

	startRecording = async () => {
		try {
			await Audio.requestPermissionsAsync();
			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
			})

			const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

			this.setState({ recording: recording })
		} catch (err) {
			console.error('Failed to start ', err);
        }
	}

	stopRecording = async () => {
		const { recording } = this.state;
		console.log('Stopping recording..');
		await recording.stopAndUnloadAsync();
		await Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
		});
		const uri = recording.getURI();
		this.setState({
			recording: undefined,
			latestRecording: uri,
        })
		console.log('Recording stopped and stored at', uri);
		try {
			await this.loadSound("localSound", this.state.latestRecording);
			console.log('Attached ', uri, ' to the local sound');
		} catch (err) {
			console.log('FAILED TO ATTACH ', uri);
        }
    }

	render() {
		return (
			<View style={styles.container}>
				<Button title="Play Local Sound" onPress={()=>this.playSoundFromPboKey("localSound")} />
				<Button
					title={this.state.remoteSoundPlaying ? "Stop Remote Sound" : "Play Remote Sound"}
					onPress={this.playRemoteSound} />
				{(this.state.remoteSoundPlaying) ?
					<Button
						title={this.state.remotePaused ?
							"Resume Remote Sound" : "Pause Remote Sound"}
						onPress={this.pauseRemoteSound} /> :
					<></>
				}
				<Button
					title={this.state.recording ? 'Stop Recording' : 'Start Recording'}
					onPress={this.state.recording ? this.stopRecording : this.startRecording}
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 50,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
});
