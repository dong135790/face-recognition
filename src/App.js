import React, { Component } from 'react';
// import Particles from 'react-particles-js';
import ParticlesBg from 'particles-bg'
import Clarifai from 'clarifai';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';

//You must add your own API key here from Clarifai.
const app = new Clarifai.App({
 apiKey: '5fde08fddc114482aff02592d711d265'
});

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signout',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signout',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
   
    // HEADS UP! Sometimes the Clarifai Models can be down or not working as they are constantly getting updated.
    // A good way to check if the model you are using is up, is to check them on the clarifai website. For example,
    // for the Face Detect Mode: https://www.clarifai.com/models/face-detection
    // If that isn't working, then that means you will have to wait until their servers are back up. 

    app.models.predict('face-detection', this.state.input)
      .then(response => {
        console.log('hi', response)
        if (response) {
          fetch('https://smart-brain-servers-1721a526b5f8.herokuapp.com/image', {
            method: 'put',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count}))
            })
            .catch((err) => console.log(err))

        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({initialState})
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
      <div className="App">
        {/* Background Particles */}
        <ParticlesBg type="fountain" bg={true} />
        {/* Accepts 2 properties:
            isSignedIn => Determines if the user is signed in or not.
              Due to this, it will condition itself to display different options on nav
            onRouteChange => Used to change the route of the page to login/signUp (if signed out)
              or logout (if isSignedIn is true) */}
        <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange} />
        {/* if your route is home, which means you are logged in, then display 
        <Logo>
        <Rank>
        <ImageLinkForm>
        <FaceRecognition>
         */}
        { route === 'home'
          ? <div>
              {/* Just the brain logo */}
              <Logo />
              {/* Displays your name and how many times you've submitted an image */}
              <Rank
                name={this.state.user.name}
                entries={this.state.user.entries}
              />
              {/* 2 properties:
              OnInputChange => Represents the <input> value and changes based on state
              onButtonSubmit => Take the input from the state and use that to update the image state
                This imageUrl state will then be used in the FaceRecognition component */}
              <ImageLinkForm
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              {/* Box shows the box of the face recongition program */}
              {/* imageUrl is the input.value we obtained from state in ImageLinkForm */}
              <FaceRecognition box={box} imageUrl={imageUrl} />
            </div>
          : (
             route === 'signin'
             ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
             : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            )
        }
      </div>
    );
  }
}

export default App;
