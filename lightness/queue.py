import os
import sys
import ast
import subprocess
import time
import json
import shlex
from lightness.playlist import Playlist
from lightness.logger import Logger
from lightness.videosettings import VideoSettings
from lightness.videoplayer import VideoPlayer
from lightness.videoprocessor import VideoProcessor
from lightness.config import Config

# The Queue is responsible for playing the next video in the Playlist
class Queue:

    __playlist = None
    __config = None
    __logger = None

    def __init__(self):
        self.__playlist = Playlist()
        self.__config = Config()
        self.__logger = Logger().set_namespace(self.__class__.__name__)
        self.__clear_screen()

    def run(self):
        while True:
            next_video = self.__playlist.get_next_video()
            if next_video:
                self.__play_video(next_video)
            time.sleep(0.050)

    def __play_video(self, video_record):
        if not self.__playlist.set_current_video(video_record["playlist_video_id"]):
            # Someone deleted the video from the queue in between getting the video and starting it.
            return

        video_settings = self.__get_video_settings(video_record)
        video_player = VideoPlayer(video_settings)
        video_processor = VideoProcessor(video_settings, video_record['playlist_video_id'])
        video_processor.process_and_play(url = video_record["url"], video_player = video_player)

        self.__playlist.end_video(video_record["playlist_video_id"])

    def __clear_screen(self):
        # VIdeoPlayer.__init__() method will clear the screen
        VideoPlayer(self.__get_video_settings())

    def __get_video_settings(self, video_record = None):
        config = self.__config.get_video_settings()

        if 'color_mode' in config:
            color_mode = config['color_mode']
        else:
            color_mode = VideoSettings.COLOR_MODE_COLOR
            if video_record:
                color_modes = [
                    VideoSettings.COLOR_MODE_COLOR,
                    VideoSettings.COLOR_MODE_BW,
                    VideoSettings.COLOR_MODE_R,
                    VideoSettings.COLOR_MODE_G,
                    VideoSettings.COLOR_MODE_B
                ]
                if video_record["color_mode"] in color_modes:
                    color_mode = video_record["color_mode"]

        if 'display_width' in config:
            display_width = config['display_width']
        else:
            display_width = VideoSettings.DEFAULT_DISPLAY_WIDTH

        if 'display_height' in config:
            display_height = config['display_height']
        else:
            display_height = VideoSettings.DEFAULT_DISPLAY_HEIGHT

        if 'should_play_audio' in config:
            should_play_audio = config['should_play_audio']
        else:
            should_play_audio = True

        if 'brightness' in config:
            brightness = config['brightness']
        else:
            brightness = VideoSettings.DEFAULT_BRIGHTNESS

        if 'flip_x' in config:
            flip_x = config['flip_x']
        else:
            flip_x = False

        if 'flip_y' in config:
            flip_y = config['flip_y']
        else:
            flip_y = False

        if 'should_save_video' in config:
            should_save_video = config['should_save_video']
        else:
            should_save_video = False

        if 'log_level' in config:
            log_level = config['log_level']
        else:
            log_level = VideoSettings.LOG_LEVEL_NORMAL

        return VideoSettings(
            color_mode = color_mode, display_width = display_width, display_height = display_height,
            should_play_audio = should_play_audio, brightness = brightness,
            flip_x = flip_x, flip_y = flip_y, should_save_video = should_save_video,
            log_level = log_level, should_check_playlist = True,
        )
