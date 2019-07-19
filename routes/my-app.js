var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
mongoose.connect('mongodb://172.18.1.221/file', { useNewUrlParser: true });
var conn = mongoose.connection;
var multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);


router.get('/', function(req, res, next) {
    res.send('my-app');
  });

  /** Setting up storage using multer-gridfs-storage */
const storage = new GridFsStorage({
  url: 'mongodb://172.18.1.221/file',
  file: (req, file) => {
      return {
          filename: file.originalname,
          bucketName: req.params.collection,
          metadata: req.body,
      };
  },
});

//multer settings for single upload
var upload = multer({
  storage: storage
});

const arrUpload = upload.array('file', 12);
router.post('/upload/:collection', (req, res) => {
  try {
      arrUpload(req, res, function (err) {
          if (err) {
              res.json({
                  status: 'failed',
                  error_code: 1,
                  err_desc: err
              });
              return;
          }
          res.json({ app: req.files });
      });
  } catch (error) {
      res.json({
          status: 'failed',
          error_code: 1,
          err_desc: 'file not found '
      });
      return;
  }
})





//从mongodb中下载文件
router.get('/download/:collection', function (req, res) {
  try {
      //   var collection = req.query.collection;
      var collection = req.params.collection;
      var id = req.query.id;
      if (collection == "") {
          collection = 'other';
      }
      id = mongoose.Types.ObjectId(id);
      gfs.collection(collection);
      /** First check if file exists */
      gfs.files.find({ _id: id }).toArray(function (err, files) {
          if (!files || files.length === 0) {
              return res.status(404).json({
                  status: 'failed',
                  error_code: 1,
                  err_desc: 'file not found '
              });
          }
          var filename = files[0].filename;
          /** create read stream */
          var readstream = gfs.createReadStream({
              _id: id,
              root: collection
          });
          /** set the proper content type */
          res.set({
              'Content-Type': files[0].contentType,
              'Content-Disposition': 'inline; filename=' + encodeURI(filename)
          });
          return readstream.pipe(res);
      });
  } catch (error) {
      res.json({
          status: 'failed',
          error_code: 1,
          err_desc: 'file not found '
      });
      return;
  }
});


//从mongodb中删除附件
router.get('/delete/:collection', (req, res) => {
  try {
      var id = req.query.id;
      //var collection = req.query.collection;
      var collection = req.params.collection;
      if (collection == "") {
          collection = 'other';
      }
      gfs.exist({
          _id: id,
          root: collection
      }, (err, file) => {
          if (err || !file) {
              res.json({
                  status: 'failed',
                  error_code: 1,
                  err_desc: 'file not found '
              });
              return;
          }
          gfs.remove({
              _id: id,
              root: collection
          }, (err) => {
              if (err) res.status(500).send(err);
              res.send('success');
          });
      });
  } catch (error) {
      res.json({
          status: 'failed',
          error_code: 1,
          err_desc: 'file not found '
      });
      return;
  }
});


// 查询单个附件的元数据
router.get('/meta/:collection', (req, res) => {
  try {
      var id = req.query.id;
      //var collection = req.query.collection;
      var collection = req.params.collection;
      // console.log(req.params.collection);
      if (collection == "") {
          collection = 'other';
      }
      gfs.collection(collection).find({ _id: mongoose.Types.ObjectId(id) }).toArray((err, files) => {
          if (err || (files[0] == null)) {
              res.json({
                  status: 'failed',
                  error_code: 1,
                  err_desc: 'file not found '
              });
              return;
          }
          res.json({ app: files });
      });
  } catch (error) {
      res.json({
          status: 'failed',
          error_code: 1,
          err_desc: 'file not found '
      });
      return;
  }
});


//分页分类查询 
router.get('/find/:collection', (req, res) => {
  var limit = req.query.limit;
  var skip = req.query.skip;
  var yxfa = req.query.yxfa;

  limit = Number(limit);
  skip = Number(skip);
  var collection = req.params.collection;
  var relyid = req.query.relyid;

  if (collection == "") {
      collection = 'other';
  }
  if (limit == "") {
      limit = 10000;
  }
  if (skip == "") {
      skip = 0;
  }
  if (yxfa == undefined) {
      console.log("undefined");
      gfs.collection(collection).find({
          "metadata.relyid": relyid
      }).skip(skip).limit(limit).toArray((err, files) => {
          if (err) res.send(err);
          res.json({ app: files });
      });
  } else {
      console.log(yxfa);
      gfs.collection(collection).find({
          "metadata.relyid": relyid,
          "metadata.yxfa": yxfa
      }).skip(skip).limit(limit).toArray((err, files) => {
          if (err) res.send(err);
          res.json({ app: files });
      });
  }
});


//从mongodb中下载文件 relyid
router.get('/down/:collection', function (req, res) {
  try {
      var collection = req.params.collection;
      var relyid = req.query.relyid;
      var id = null;
      gfs.collection(collection).find({
          "metadata.relyid": relyid
      }).toArray((err, files) => {
          if (err) res.send(err);
          if (files.length == 0) {
              return res.status(404).json({
                  status: 'failed',
                  error_code: 1,
                  err_desc: 'file not found '
              });
          }
          else {
              id = (files[0]._id);
              id = mongoose.Types.ObjectId(id);
              gfs.collection(collection);
              // First check if file exists 
              gfs.files.find({ _id: id }).toArray(function (err, files) {
                  if (!files || files.length == 0) {
                      return res.status(404).json({
                          status: 'failed',
                          error_code: 1,
                          err_desc: 'file not found '
                      });
                  }
                  var filename = files[0].filename;
                  // create read stream 
                  var readstream = gfs.createReadStream({
                      _id: id,
                      root: collection
                  });
                  // set the proper content type 
                  res.set({
                      'Content-Type': files[0].contentType,
                      'Content-Disposition': 'inline; filename=' + encodeURI(filename)
                  });
                  return readstream.pipe(res);
              });
          }

      });
  } catch (error) {
      res.json({
          status: 'failed',
          error_code: 1,
          err_desc: 'file not found '
      });
      return;
  }

});

module.exports = router;
// app.listen('3003', function () {
//     console.log('running on 3003...');
// });