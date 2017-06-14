
import { observable, action, computed } from 'mobx';
import axios from 'axios';
import { CLIENT_ID } from '../config';
import songsFilter from '../utils/songsFilter';

class Profile {

    @observable loading = false;
    @observable followers = [];
    @observable suggestions = [];
    @observable recent = [];
    @observable likes = [];
    @observable showLoadMoreSuggestion = false;

    followersHrefNext;
    suggestionHrefNext;
    recentHrefNext;
    likesHrefNext;

    @action async getFollowers(userid) {

        var response = await axios.get(`https://api.soundcloud.com/users/${userid}/followings?
            &client_id=${CLIENT_ID}
            &limit=5
            &offset=0
            &linked_partitioning=0
            `.replace(/\s/g, ''));

        self.followers.replace(response.data.collection);
        self.followersHrefNext = response.data.next_href;
    }

    @action async loadMoreFollowers() {

        var response = await axios.get(self.followersHrefNext);

        self.followers.push(...response.data.collection);
        self.followersHrefNext = response.data.next_href;
    }

    @action async getSuggestion() {

        var response = await axios.get(`https://api-v2.soundcloud.com/me/personalized-tracks?
            &linked_partitioning=0
            &limit=5
            &offset=0
            &client_id=${CLIENT_ID}
            `.replace(/\s/g, ''));

        self.suggestions.replace(response.data.collection);
        self.suggestionHrefNext = response.data.next_href;
    }

    @action async loadMoreSuggestion() {

        self.showLoadMoreSuggestion = true;

        var response = await axios.get(self.suggestionHrefNext);

        self.suggestions.push(...response.data.collection);
        self.suggestionHrefNext = response.data.next_href;
        self.showLoadMoreSuggestion = false;
    }

    @action async getRecent() {

        var response = await axios.get(`https://api-v2.soundcloud.com/me/play-history/tracks?
            &client_id=${CLIENT_ID}
            &limit=20
            &offset=0
            &linked_partitioning=0
            `.replace(/\s/g, ''));

        var songs = songsFilter(response.data.collection.map(e => e.track));

        self.recent.replace(songs);
        self.recentHrefNext = response.data.next_href;

        return songs;
    }

    @action async loadMoreRecent() {

        var response = await axios.get(self.recentHrefNext);
        var songs = songsFilter(response.data.collection.map(e => e.track));

        self.recent.push(...songs);
        self.recentHrefNext = response.data.next_href;

        return songs;
    }

    @action async getLikes(userid) {

        var response = await axios.get(`https://api-v2.soundcloud.com/users/${userid}/track_likes?
            &client_id=${CLIENT_ID}
            &limit=20
            &offset=0
            &linked_partitioning=0
            `.replace(/\s/g, ''));

        var songs = songsFilter(response.data.collection.map(e => e.track));

        self.likes.replace(songs);
        self.likesHrefNext = response.data.next_href;

        return songs;
    }

    @action async loadMoreLikes() {

        if (!self.likesHrefNext) {
            return [];
        }

        var response = await axios.get(self.likesHrefNext);
        var songs = songsFilter(response.data.collection.map(e => e.track));

        self.likes.push(...songs);
        self.likesHrefNext = response.data.next_href;

        return songs;
    }
}

const self = new Profile();
export default self;
