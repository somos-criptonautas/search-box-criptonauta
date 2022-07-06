import SearchIndex from './search-index';
import nock from 'nock';

describe('search index', function () {
    test('initializes search index', async () => {
        const siteURL = 'http://localhost';
        const apiKey = '69010382388f9de5869ad6e558';
        const searchIndex = new SearchIndex({siteURL, apiKey, storage: localStorage});

        const scope = nock('http://localhost/ghost/api/content')
            .get('/posts/?key=69010382388f9de5869ad6e558&limit=all&fields=id%2Cslug%2Ctitle%2Cexcerpt%2Curl%2Cupdated_at%2Cvisibility&order=updated_at%20DESC&formats=plaintext')
            .reply(200, {
                posts: []
            })
            .get('/authors/?key=69010382388f9de5869ad6e558&limit=all&fields=id,slug,name,url,profile_image')
            .reply(200, {
                authors: []
            })
            .get('/tags/?key=69010382388f9de5869ad6e558&&limit=all&fields=id,slug,name,url')
            .reply(200, {
                tags: []
            });

        await searchIndex.init({siteURL, apiKey});

        expect(scope.isDone()).toBeTruthy();

        const searchResults = searchIndex.search('find nothing');

        expect(searchResults.posts.length).toEqual(0);
        expect(searchResults.authors.length).toEqual(0);
        expect(searchResults.tags.length).toEqual(0);
    });

    test('allows to search for indexed posts and authors', async () => {
        const siteURL = 'http://localhost';
        const apiKey = '69010382388f9de5869ad6e558';
        const searchIndex = new SearchIndex({siteURL, apiKey, storage: localStorage});

        nock('http://localhost/ghost/api/content')
            .get('/posts/?key=69010382388f9de5869ad6e558&limit=all&fields=id%2Cslug%2Ctitle%2Cexcerpt%2Curl%2Cupdated_at%2Cvisibility&order=updated_at%20DESC&formats=plaintext')
            .reply(200, {
                posts: [{
                    id: 'sounique',
                    title: 'Awesome Barcelona Life',
                    excerpt: 'We are sitting by the pool and smashing out search features',
                    url: 'http://localhost/ghost/awesome-barcelona-life/'
                }]
            })
            .get('/authors/?key=69010382388f9de5869ad6e558&limit=all&fields=id,slug,name,url,profile_image')
            .reply(200, {
                authors: [{
                    id: 'different_uniq',
                    slug: 'barcelona-author',
                    name: 'Barcelona Author',
                    profile_image: 'https://url_to_avatar/barcelona.png',
                    url: 'http://localhost/ghost/authors/barcelona-author/'
                }, {
                    id: 'different_uniq_2',
                    slug: 'bob',
                    name: 'Bob',
                    profile_image: 'https://url_to_avatar/barcelona.png',
                    url: 'http://localhost/ghost/authors/bob/'
                }]
            })
            .get('/tags/?key=69010382388f9de5869ad6e558&&limit=all&fields=id,slug,name,url')
            .reply(200, {
                tags: [{
                    id: 'uniq_tag',
                    slug: 'barcelona-tag',
                    name: 'Barcelona Tag',
                    url: 'http://localhost/ghost/tags/barcelona-tag/'
                }]
            });

        await searchIndex.init({siteURL, apiKey});

        let searchResults = searchIndex.search('Barcelona');
        expect(searchResults.posts.length).toEqual(1);
        expect(searchResults.posts[0].title).toEqual('Awesome Barcelona Life');
        expect(searchResults.posts[0].url).toEqual('http://localhost/ghost/awesome-barcelona-life/');

        expect(searchResults.authors.length).toEqual(1);
        expect(searchResults.authors[0].name).toEqual('Barcelona Author');
        expect(searchResults.authors[0].url).toEqual('http://localhost/ghost/authors/barcelona-author/');
        expect(searchResults.authors[0].profile_image).toEqual('https://url_to_avatar/barcelona.png');

        expect(searchResults.tags.length).toEqual(1);
        expect(searchResults.tags[0].name).toEqual('Barcelona Tag');
        expect(searchResults.tags[0].url).toEqual('http://localhost/ghost/tags/barcelona-tag/');

        searchResults = searchIndex.search('Nothing like this');
        expect(searchResults.posts.length).toEqual(0);
        expect(searchResults.authors.length).toEqual(0);
        expect(searchResults.tags.length).toEqual(0);
    });
});
