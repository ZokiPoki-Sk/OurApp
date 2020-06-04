//VIIPPP:require func. vo node pravi 2 raboti:it execute set file, i pod 2 it also returns whatever that file exports.I toa se skladira vo varijablata t.e let-ot. I posle samo so povikuvanje na let-ot ga dobivame podatokot
//Koga require a file the entire file is going to be executed immediately.No se sto ke exportitame od toj file moze da se skladira vo nasata varijabla i moze da ja iskoristime koga i kade mislime deka ke odgovoara
//se mozeme da exportirame najcesto ke bidat objekti so svoi properties.I tuka e fintata vo serverot mozeme preku niv skladirani so taa varijabla da se odnesuvame kako so object koj gi sidrzi tie properties

//so npm install nodemon i posle vo json package  "scripts": { "watch": "nodemon app", ...  aktivirame samo da snima kucame samo npm run watch

const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const csrf = require('csurf')
const app = express() 
const sanitizeHTML = require("sanitize-html")

app.use(express.urlencoded({ extended: false }))   
app.use(express.json())                            

app.use('/api', require('./router-api'))


let sessionOptions = session({
  secret: "JavaScript is sooo cool",
  store: new MongoStore({ client: require('./db') }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
})

app.use(sessionOptions)
app.use(flash())


app.use(function (req, res, next) {
  //make our markdown function available from within ejs templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), { allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {} })
  }

  //make all error and success flash messages available from all tepmplates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  //make current user id available on the request object
  if (req.session.user) { req.visitorId = req.session.user._id } else { req.visitorId = 0 }

  //make user session data available from within view templates
  res.locals.user = req.session.user
  next()
})

const router = require('./router') 



app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(csrf())  

app.use(function (req, res, next) {
  res.locals.csrfToken = req.csrfToken()  
  next()
})

app.use('/', router)

app.use(function (err, req, res, next) { 
  if (err) {
    if (err.code == "EBADCSRFTOKEN") {
      req.flash('errors', "Cross site request forgery detected.")
      req.session.save(() => res.redirect('/'))
    } else {
      res.rennder('404')
    }
  }
})

const server = require('http').createServer(app)

const io = require("socket.io")(server)

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next) 
})

io.on("connection", function (socket) { 
  if (socket.request.session.user) {

    let user = socket.request.session.user

    socket.emit('welcome', { username: user.username, avatar: user.avatar })

    socket.on('chatMessageFromBrowser', function (data) {
      socket.broadcast.emit('chatMessageFromServer', { message: sanitizeHTML(data.message, { allowedTags: [], allowedAttributes: {} }), username: user.username, avatar: user.avatar })
    })                                                                          
  }
})

module.exports = server 

