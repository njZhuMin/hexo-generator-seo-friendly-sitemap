var Hexo = require('hexo'),
  moment = require('moment'),
  _ = require('lodash'),
  Promise = require('bluebird'),
  chai = require('chai'),
  assert = chai.assert,
  tag = require('../lib/tag');

var instanciateHexo = function (tag) {
  var hexo = new Hexo(__dirname, {silent: true});
  hexo.config.sitemap = {
    path: 'sitemap.xml'
  };
  if (tag !== undefined) {
    hexo.config.sitemap.tag = tag;
  }
  hexo.config.permalink = ':title';
  hexo.init();
  return Promise.resolve(hexo);
};

var insertPosts = function (hexo) {
  var Post = hexo.model('Post');
  var mockedPosts = [
    {source: 'foo', slug: 'foo', path: 'foo', updated: moment.utc([2015, 0, 1, 8]).toDate()},
    {source: 'bar', slug: 'bar', path: 'bar', updated: moment.utc([2015, 0, 2, 14]).toDate()},
    {source: 'baz', slug: 'baz', path: 'baz', updated: moment.utc([2015, 0, 3, 16]).toDate()}
  ];
  return [hexo, Post.insert(mockedPosts)];
};

var setPostTag = function (hexo, posts) {
  var post = posts[1];
  return [hexo, post.setTags(['Tag1'])];
};

var getHexoLocalsAndConfig = function (hexo) {
  return Promise.resolve([hexo.locals.toObject(), hexo.config]);
};

describe('SEO-friendly sitemap generator', function () {
  var applyTag = function (args) {
    return tag.apply(null, args);
  };

  it('should not generate sitemap tag file if no tags are mentioned in posts', function () {
    var checkAssertions = function (result) {
      assert.isUndefined(result);
    };

    return instanciateHexo()
      .then(getHexoLocalsAndConfig)
      .then(applyTag)
      .call('get')
      .then(checkAssertions);
  });

  it('should generate sitemap tag data', function () {
    var checkAssertions = function (result) {
      assert.isObject(result);
      assert.isTrue(moment(result.lastModification).isSame(moment.utc([2015, 0, 2, 14])));
      assert.isArray(result.data.items);
      assert.lengthOf(result.data.items, 1);
      assert.isTrue(_.some(result.data.items, {name: 'Tag1'}));
    };

    return instanciateHexo()
      .then(insertPosts)
      .spread(setPostTag)
      .spread(getHexoLocalsAndConfig)
      .then(applyTag)
      .call('get')
      .then(checkAssertions);
  });

  it('should not generate sitemap tag file if config.sitemap.tag set to false', function () {
    var checkAssertions = function (result) {
      assert.isUndefined(result);
    };

    return instanciateHexo(false)
      .then(insertPosts)
      .spread(setPostTag)
      .spread(getHexoLocalsAndConfig)
      .then(applyTag)
      .call('get')
      .then(checkAssertions);
  });
});
