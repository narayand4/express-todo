var express = require('express');
var routes = require('./routes');
var tasks = require('./routes/tasks');
var http = require('http');
var path = require('path');
var mongoskin = require('mongoskin');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var csrf = require('csurf');
var errorHandler = require('errorhandler')

var db = mongoskin.db('mongodb://express:qaz123wsx@localhost:27017/expressdb');

var app = express();

app.use(function(req, res, next){
    req.db = {};
    req.db.tasks = db.collection('tasks');
    next();
});

app.locals.appname = 'Express.js Todo App'

app.set('port', process.env.PORT || 3000);
app.set('views',__dirname+'/views');
app.set('view engine','jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(csrf());
app.use(function(req, res, next){
    res.locals.token = req.csrfToken();
    next();
});

app.use(require('express-less-middleware')({
    src: __dirname + '/public',
    compress: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) { res.locals._csrf = req.csrfToken(); return next(); });

if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.param('task_id', function(req, res, next, taskId) {
    req.db.tasks.findById(taskId, function(error, task){
        if (error) return next(error);
        if (!task) return next(new Error('Task is not found.'));
        req.task = task;
        return next();
    });
});

app.get('/', routes);
app.get('/tasks', tasks.list);
app.post('/tasks', tasks.markAllCompleted);
app.post('/tasks', tasks.add);
app.post('/tasks/:task_id', tasks.markCompleted);
app.del('/tasks/:task_id', tasks.delete);
app.get('/tasks/completed', tasks.completed);

app.all('*', function(req, res){
    res.send(404);
});

http.createServer(app).listen(app.get('port'),
    function(){
        console.log('Express server listening on port '
        + app.get('port'));
    }
);
