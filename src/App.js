import React, { Component } from 'react';
import './App.css';

let buttonStyle = {
  'padding': '20px',
  'marginTop': '100px',
  'fontSize': '50px',
  'border': 'none',
  'borderRadius': '10px',
  'appearance': 'none',
  'outline': 'none',
  'cursor': 'pointer',
}

class PlaylistCounter extends Component {
  render() {
    return (
      <div>
        <h2>{this.props.playlists.length} Playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render() {
    let totalDurationSeconds = this.props.playlists.reduce((sum, eachSong) => {
      return sum + eachSong.duration;
    }, 0);

    let totalDuration = totalDurationSeconds / 3600;
    totalDuration = (Math.floor(totalDuration * 100) / 100);

    return (
      <div>
        <h2>{totalDuration} Hours</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render() {
    return (
      <div>
        <input type="text" onChange={(event) => {return this.props.onTextChange(event.target.value)}}/>
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist;

    return (
      <div style={{'width': '20%', 'display': 'inline-block'}}>
        <img src={playlist.imageURL} alt={playlist.name}/>
        <h3>{playlist.name}</h3>
        <ul>
          {
            playlist.songs.map((song) => {
              return <li>{song.name}</li>;
            })
          }
        </ul>
      </div>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      filterString: '',
    };
  }

  componentDidMount() {
    let accessToken = new URL(window.location.href).searchParams.get('access_token');

    if(!accessToken) {
      return;
    }

    fetch('https://api.spotify.com/v1/me', {headers: {'Authorization': 'Bearer ' + accessToken}})
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        return this.setState({
          user: {
            name: data.display_name
          }
        });
      });

    fetch('https://api.spotify.com/v1/me/playlists', {headers: {'Authorization': 'Bearer ' + accessToken}})
      .then((response) => {
        return response.json();
      })
      .then((playlistData) => {
        let playlists = playlistData.items;
        let trackDataPromises = playlists.map((playlist) => {
          let responsePromise = fetch(playlist.tracks.href, {headers: {'Authorization': 'Bearer ' + accessToken}});
          let trackDataPromise = responsePromise
            .then((promise) => {
              return promise.json();
            });
          return trackDataPromise;
        });
        let allTracksDataPromises = Promise.all(trackDataPromises);
        let playlistsPromise = allTracksDataPromises
          .then((trackDatas) => {
            trackDatas.forEach((trackData, i) => {
              playlists[i].trackDatas = trackData.items
                .map((item) => {
                  return item.track
                })
                .map((trackData) => {
                  return {
                    name: trackData.name,
                    duration: trackData.duration_ms / 1000,
                  };
                });
            });
            return playlists;
          });
        return playlistsPromise;
      })
      .then((playlists) => {
        return this.setState({
          playlists: playlists.map((item) => {
            return {
              name: item.name,
              imageURL: item.images[2].url,
              songs: item.trackDatas.slice(0, 3),
              duration: item.trackDatas.reduce((duration, trackData) => {
                return duration += trackData.duration
              }, 0),
            };
          })
        });
      });
  }

  render() {
    let playlistsToRender = this.state.user && this.state.playlists ? this.state.playlists.filter((playlist) => {
      let matchesPlaylist = playlist.name.toLowerCase().includes(this.state.filterString.toLowerCase());
      let matchesSongs = playlist.songs.find((song) => {
        return song.name.toLowerCase().includes(this.state.filterString.toLowerCase());
      });

      return matchesPlaylist || matchesSongs
    }) : [];

    return (
      <div className="App">
        {
          this.state.user ?
          <div>
            <h1>
              {this.state.user.name}'s Playlists
            </h1>
            <PlaylistCounter playlists={playlistsToRender}></PlaylistCounter>
            <HoursCounter playlists={playlistsToRender}></HoursCounter>
            <Filter onTextChange={(text) => {return this.setState({filterString: text})}}></Filter>
            {
              playlistsToRender.map((playlist) => {
                return <Playlist playlist={playlist}></Playlist>;
              })
            }
          </div> : <button onClick={() => {return window.location = 'http://192.168.178.58:8888/login'}} style={buttonStyle}>Sign in with Spotify</button>
        }
      </div>
    );
  }
}

export default App;
