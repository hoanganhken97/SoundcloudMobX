
import React, { Component, PropTypes } from 'react';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { inject, observer } from 'mobx-react/native';
import {
    View,
    Text,
    Dimensions,
    Animated,
    TouchableOpacity,
    ListView,
    StyleSheet,
} from 'react-native';

import Loader from '../../../components/Loader';
import FadeImage from '../../../components/FadeImage';
import SongCard from './Song';

@inject(stores => {
    return {
        playlist: stores.category.playlist,
        genre: stores.category.genre,
        doRefresh: stores.category.doRefresh,
        loading4refresh: stores.category.loading4refresh,
        doLoadmore: stores.category.doLoadmore,
        loading4loadmore: stores.category.loading4loadmore,
        hasEnd: stores.category.hasEnd,
        init: stores.category.init,

        mark4playing: () => {
            stores.charts.setType4playing(stores.category.type);
        },

        player: stores.player,

        isPlaying: () => {
            var player = stores.player;
            return player.playing
                && player.playlist.uuid === stores.category.playlist.uuid;
        },

        updatePlaylist: (playlist) => {
            var player = stores.player;

            /** When load more update the playlist of player */
            if (playlist.uuid === player.playlist.uuid
                && playlist.length !== player.playlist.length) {
                player.updatePlaylist(playlist.slice());
            }
        }
    };
})
@observer
export default class Category extends Component {
    static propTypes = {
        navigation: PropTypes.object.isRequired,
    };

    componentWillMount() {
        this.props.init(this.props.navigation.state.params.data);
    }

    componentWillReceiveProps(nextProps) {
        this.props.updatePlaylist(nextProps.playlist);
    }

    renderCoverWall(start = 0, end = 5) {
        var playlist = this.props.playlist;

        if (!playlist.length) {
            return false;
        }

        return new Array(end - start).fill(0).map((e, index) => {
            var song = playlist[start + index];

            return (
                <FadeImage key={index + start} {...{
                    source: {
                        uri: song.artwork
                    },

                    style: {
                        height: 75,
                        width: 75,
                    }
                }} />
            );
        });
    }

    showPlaying(song) {
        this.props.mark4playing();
        this.props.navigation.navigate('Player');
        this.props.player.start({
            song,
            playlist: this.props.playlist,
        });
    }

    togglePlayer() {
        var { playlist, player, isPlaying } = this.props;

        if (!isPlaying()) {
            this.showPlaying(playlist[0]);
        } else {
            player.toggle();
        }
    }

    state = {
        opacity: new Animated.Value(0),
    };

    render() {
        var { playlist, genre, doRefresh, loading4refresh, doLoadmore, loading4loadmore, hasEnd, player } = this.props;
        var playing = this.props.isPlaying();
        var ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1.id !== r2.id
        });
        var dataSource = ds.cloneWithRows(playlist.slice());
        var opacity = this.state.opacity.interpolate({
            inputRange: [-40, -10],
            outputRange: [1, 0],
        });

        return (
            <View style={styles.container}>

                <Loader {...{
                    show: true,
                    animate: loading4refresh,
                    text: 'REFRESH',
                    style4container: {
                        top: 160,
                        width,
                        opacity: loading4refresh ? 1 : opacity,
                        transform: [{
                            rotate: '0deg'
                        }]
                    }
                }} />

                <View style={styles.header}>
                    <View style={styles.coverWall}>
                        {
                            this.renderCoverWall(0, 5)
                        }
                    </View>
                    <View style={styles.coverWall}>
                        {
                            this.renderCoverWall(5, 10)
                        }
                    </View>
                    <TouchableOpacity onPress={() => this.props.navigation.goBack()} style={styles.back}>
                        <Icon name="arrow-left" color="white" size={14} />
                    </TouchableOpacity>

                    <View style={styles.hero}>
                        <View>
                            <Text style={styles.genre}>
                                # {genre.name}
                            </Text>
                            <Text style={styles.count}>
                                {playlist.length} Tracks
                            </Text>
                        </View>

                        <TouchableOpacity onPress={() => this.togglePlayer()}>
                            {
                                playing && !player.paused
                                    ? <Icon name="control-pause" size={20} color="red" />
                                    : <Icon name="control-play" size={20} color="red" />
                            }
                        </TouchableOpacity>
                    </View>
                </View>

                <ListView

                    onScrollEndDrag={e => {
                        if (e.nativeEvent.contentOffset.y < -40) {
                            doRefresh();
                        }
                    }}

                    onEndReachedThreshold={1}
                    onEndReached={() => {
                        if (hasEnd === false) {
                            doLoadmore();
                        }
                    }}

                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{
                            nativeEvent: {
                                contentOffset: {
                                    y: this.state.opacity
                                }
                            }
                        }]
                    )}

                    style={[styles.playlist, loading4refresh && {
                        paddingTop: 40
                    }]}

                    enableEmptySections={true}
                    dataSource={dataSource}
                    renderRow={(song, sectionId, rowId) => {
                        var active = playing && song.id === player.song.id;

                        return (
                            <View>
                                <SongCard {...{
                                    artwork: song.artwork,
                                    title: song.title,
                                    user: song.user,
                                    active: !!active,
                                    play: () => {
                                        this.showPlaying(song);
                                    },
                                    rank: +rowId + 1,
                                }} />

                                {
                                    ++rowId === 50 && (
                                        <View style={{
                                            width,
                                            marginTop: 10,
                                            marginBottom: 10,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'row',
                                        }}>
                                            <View style={styles.line} />

                                            <Text style={styles.end}>END</Text>

                                            <View style={styles.line} />
                                        </View>
                                    )
                                }
                            </View>
                        );
                    }} />
                {
                    loading4loadmore && (

                        <View style={{
                            position: 'absolute',
                            top: 150,
                            left: 0,
                            width,
                            height: height - 150,
                            backgroundColor: 'rgba(255,255,255,.9)',
                            zIndex: 99
                        }}>
                            <Loader {...{
                                show: true,
                                animate: true,
                                text: 'LOAD MORE',
                                style4container: {
                                    width,
                                    transform: [{
                                        rotate: '0deg'
                                    }]
                                }
                            }} />
                        </View>
                    )
                }
            </View>
        );
    }
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },

    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: 150,
        zIndex: 9
    },

    back: {
        position: 'absolute',
        left: 10,
        top: 30,
        height: 32,
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 9,
    },

    coverWall: {
        height: 75,
        width,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: {
            height: 8,
            width: -2
        },
    },

    hero: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 150,
        width,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 75,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,.6)'
    },

    genre: {
        color: '#fff'
    },

    count: {
        marginTop: 10,
        color: 'rgba(255,255,255,.8)',
        fontSize: 12,
        fontWeight: '100',
    },

    playlist: {
        marginTop: 150,
    },

    line: {
        height: 1,
        width: 20,
        backgroundColor: '#000'
    },

    end: {
        marginRight: 10,
        marginLeft: 10,
        fontSize: 12,
        fontWeight: '100'
    },
});
