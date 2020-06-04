const Post = require('../models/Post')

exports.viewCreateScreen = function (req, res) {
  res.render('create-post')
}

exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id)
  post.create().then(function (i) {
    req.flash("success", "New post successfully created.")
    req.session.save(() => res.redirect(`/post/${i}`)) //kako da imame redirect kon _id na post koga sega e kreiran. zatoa odime vo model metod create i preku ops array finatata dobivame info za _id na novokreiraniot post
  }).catch(function (errors) {
    errors.forEach((error) => req.flash('errors', error))
    req.session.save(() => res.redirect('/create-post'))
  })
}

exports.apiCreate = function (req, res) {
  let post = new Post(req.body, req.apiUser._id)
  post.create().then(function (i) {
    res.json("Congrats") 
  }).catch(function (errors) {
    res.json(errors)
  })
}

exports.viewSingle = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)  
    res.render('single-post-screen', { post: post, title: post.title }) 
  } catch {
    res.render("404")
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id)
    if (post.authorId == req.visitorId) {
      res.render("edit-post", { post: post })
    } else {
      req.flash("errors", "You don't have permisiion to perform that action.")
      req.session.save(() => res.redirect('/'))
    }
  } catch{
    res.render('404')
  }
}

exports.edit = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post.update().then((status) => {
    // the post was successfully added to db
    // or user did have permission but there was validation errors
    if (status == "success") {
      req.flash("successMessage", "Post successfully updated.")
      req.session.save(function () {
        res.redirect(`/post/${req.params.id}/edit`)
      })
    } else {
      post.errors.forEach(function (error) {
        req.flash("errors", error)
      })
      req.session.save(function () {
        req.redirect(`/post/${req.params.id}/edit`)
      })
    }

  }).catch(() => {
    // a post with requsted Id doesnt exist
    // or if the current visitor is not the owner of the request
    req.flash('errors', "You have no permission to perform that action.")
    req.session.save(function () {
      res.redirect('/')
    })
  })
}

exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorId).then(() => {
    req.flash('success', "Post successfully deleted.")
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
  }).catch(() => {
    // a post with requsted Id doesnt exist, or if it's not a valid Id
    // or if the current visitor is not the owner of the request 
    req.flash("errors", "You have no permission to perform that action.")
    req.session.save(() => res.redirect('/'))
  })
}

exports.apiDelete = function (req, res) {
  Post.delete(req.params.id, req.apiUser._id).then(() => {
    res.json("Success")
  }).catch(() => {
    res.json("You don't have permission to perform that action.")
  })
}

exports.search = function (req, res) {
  Post.search(req.body.searchTerm).then((posts) => {
    res.json(posts)
  }).catch(() => {
    res.json([])
  })
}