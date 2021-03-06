
import { observable, action } from 'mobx';
import { AsyncStorage } from 'react-native';
import _axios from 'axios';
import { CLIENT_ID, SECRET } from '../config';

const axios = _axios.create({

    timeout: 12000,
    transformRequest: [data => {
        var str = [];

        for (let key in data) {
            let value = data[key];

            if (data.hasOwnProperty(key) && value) {
                str.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            }
        }

        return str.join('&');
    }]
});

class Session {
    auth = '';
    user = {};

    @observable loading = false;

    async init() {
        var auth = await AsyncStorage.getItem('@Session:auth');

        if (auth) {
            self.auth = JSON.parse(auth);

            if (self.auth.expires - new Date() < 100000) {
                try {
                    var response = await axios.post('https://api.soundcloud.com/oauth2/token', {
                        client_id: CLIENT_ID,
                        client_secret: SECRET,
                        grant_type: 'refresh_token',
                        refresh_token: self.auth.refresh_token
                    });

                    await self.create(response.data);
                    await self.getUserInfo();
                } catch (ex) {
                    self.auth = 0;
                }
            } else {
                await self.getUserInfo();
            }

            console.log(`SET AUTH: ${self.auth.access_token}`);
            axios.defaults.headers.common['Authorization'] = `OAuth ${self.auth.access_token}`;

            return self.user;
        }
    }

    async logout() {
        await AsyncStorage.removeItem('@Session:auth');

        self.user = {};
        self.auth = 0;
        delete axios.defaults.headers.common['Authorization'];
    }

    async getUserInfo() {
        var response = await axios.get(`https://api.soundcloud.com/me?oauth_token=${self.auth.access_token}`);
        self.user = response.data;

        return self.user;
    }

    @action async create(auth) {
        auth.expires = +new Date() + auth.expires_in * 1000;

        if (auth.access_token) {
            await AsyncStorage.setItem('@Session:auth', JSON.stringify(auth));
        }

        self.auth = auth;

        return auth;
    }

    async login(username, password) {
        self.loading = true;

        var response = await axios.post('https://api.soundcloud.com/oauth2/token', {
            client_id: CLIENT_ID,
            client_secret: SECRET,
            grant_type: 'password',
            username: username,
            password: password,
        }).catch(ex => {
            console.error('Failed login to Soundcloud:', ex);
        });

        await self.create(response.data);
        await self.init();

        self.loading = false;

        return response;
    }

    isLogin() {
        return !!self.auth;
    }
}

const self = new Session();
export default self;
