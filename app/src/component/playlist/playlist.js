import React from 'react';

import api from 'api';
import PlaylistVideo from 'dataobj/playlist_video';
import CurrentlyPlaying from './currently_playing';
import PlaylistItem from './playlist_item';

import './playlist.css';

import SwipeableList from 'component/lib/SwipeableList/SwipeableList';
import SwipeableListItem from 'component/lib/SwipeableList/SwipeableListItem';

class Playlist extends React.Component {
  constructor(props) {
    super(props);
    this.apiClient = new api();

    this.state = {
      loading: true,
      current_video: null,
      videos: []
    };

    this.nextVideo = this.nextVideo.bind(this);
    this.clearQueue = this.clearQueue.bind(this);
    this.handleSwipeVideo = this.handleSwipeVideo.bind(this);

    this.updateStateOnLoop();
  }

  setBodyScroll() {
    // todo: this doesnt work well - I need to handle this state change at the app level
  }

  render() {
    var current_video = this.getCurrentVideo();

    return (
      <div style={{'position':'fixed'}} className={"col-xs-12 col-md-6 playlist-container " + (this.props.expanded ? 'expanded' : '')}>
        <div className="playlist-bar">
          <div className={"playlist-header " + (this.props.expanded ? "" : "hidden")} onClick={this.props.togglePlaylist}>
            <span className="glyphicon glyphicon-chevron-down" aria-hidden="true" />
          </div>

          <div className={"input-group control-input-group " + (this.props.expanded ? "hidden" : "")}>
            <div className="playlist-details" onClick={this.props.togglePlaylist}>
              <span className="currently-playing">
                {this.getCurrentlyPlayingTitle()}
              </span>
            </div>

            <div className="input-group-btn">
              <button className="btn btn-default" type="button" onClick={this.nextVideo}>
                <span className="glyphicon glyphicon-step-forward" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className={"playlist-expand " + (this.props.expanded ? "" : "hidden")}>
          <div className="playlist-contents">
              {this.state.videos.length === 0 && !this.state.loading && (
                <div className='empty'>&lt;Empty Queue&gt;</div>
              )}

              {current_video && (
                  <CurrentlyPlaying video = {current_video} />
              )}

              <SwipeableList background={<span></span>}>
                {this.getQueuedVideos().map(function(video, index) {
                  return <SwipeableListItem key={video.playlist_video_id} onSwipe={() => this.handleSwipeVideo(video)}>
                    <PlaylistItem video = {video} />
                  </SwipeableListItem>;
                }.bind(this))}
              </SwipeableList>
          </div>

          <div className="playlist-footer">
            <a href="#" onClick={this.clearQueue}>Clear</a>
          </div>
        </div>
      </div>
    );
  }

  getCurrentVideo(e) {
    return this.state.videos.find((video) => {
      return (video.status === 'STATUS_PLAYING');
    });
  }

  getQueuedVideos(e) {
    return this.state.videos.filter((video) => {
      return (video.status !== 'STATUS_PLAYING');
    });
  }

  getCurrentlyPlayingTitle() {
    if (this.state.current_video) {
      return this.state.current_video.title;
    } else if (this.state.loading) {
      return '<Loading...>';
    }

    return '<Nothing>';
  }

  clearQueue(e) {
    e.preventDefault();
    this.apiClient.clearQueue();
  }

  nextVideo(e) {
    e.preventDefault();
    if (this.state.current_video) {
      this.apiClient.nextVideo(this.state.current_video.playlist_video_id);
    }
  }

  handleSwipeVideo(video) {
    this.apiClient.removeVideo(video);
  }

  updateStateOnLoop() {
    return this.apiClient.getQueue()
      .then((data) => {
        this.setState({ loading: false });

        if (data.success) {
          var videos = PlaylistVideo.fromArray(data.queue);
          var current_video = videos.find(function(video) {
            return video.status === 'STATUS_PLAYING';
          }) || null;

          if (
            (current_video && this.state.current_video && this.state.current_video.playlist_video_id !== current_video.playlist_video_id) ||
            (current_video && !this.state.current_video) ||
            (!current_video && this.state.current_video)
          ) {
            this.setState({
              current_video: current_video
            });
          }

          this.setState({
            videos: videos
          });
        }
      }).finally((data) => {
        setTimeout(this.updateStateOnLoop.bind(this), 1000);
    });
  }
}

export default Playlist;