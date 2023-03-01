/**
\file App.js
\author	Stephen Graham
\date 	2022-03-10
\brief	Sample sound effect player
		https://snack.expo.dev/@kartikeyvaish/remote-and-local-sounds
		https://morioh.com/p/ed71cad8a8c9
		
**/
import React, { Component } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';

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
  setLocalSound(newPbo){
		this.setState({
			localSound: newPbo,
		});
  }
  setRemoteSound(newPbo){
		this.setState({ 
			remoteSound: newPbo
		});
  }

  
  async componentDidMount(){
	console.log('Loading Local Sound after mount');
	await Audio.setAudioModeAsync({ playInSilentModeIOS: true });
	  await this.loadLocalSound();
	  await this.loadRemoteSound('https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3')
  }
  
	async loadLocalSound(source){
		const { sound } = await Audio.Sound.createAsync(
			require("./assets/sfx/sound3.mp3")
		);
		this.setLocalSound(sound);
	}

	loadLocalUri = async (source) => {
		const { sound } = await Audio.Sound.createAsync({
			uri: source,
		})
		this.setLocalSound(sound);
	}

	loadRemoteSound = async (source) => {
		const { sound } = await Audio.Sound.createAsync(
			{ uri: source, }
		);
		this.setRemoteSound(sound);
    }
  
  async componentWillUnmount(){
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
	console.log('Playing Sound');
	const { localSound } = this.state;
	await localSound.replayAsync();
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
			await this.loadLocalUri(this.state.latestRecording);
			console.log('Attached ', uri, ' to the local sound');
		} catch (err) {
			console.log('FAILED TO ATTACH ', uri);
        }
    }

	render() {
		return (
			<View style={styles.container}>
				<Button title="Play Local Sound" onPress={this.playLocalSound} />
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
