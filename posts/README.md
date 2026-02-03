# Blog Posts

Add your blog posts here as HTML files.

## Structure

Each post should be a separate HTML file. You can use this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Post Title - Eugenio Cruz</title>
    <link rel="icon" href="../Orange_Bird.png" type="image/png">
    <!-- Copy the same CSS from bio.html or blog.html -->
</head>
<body>
    <a href="../blog.html" class="back">← Back to blog</a>
    
    <article>
        <h1>Your Post Title</h1>
        <p class="date">February 3, 2026</p>
        
        <!-- Your content here -->
    </article>
</body>
</html>
```

## Adding posts to blog.html

Update `blog.html` with a new entry for each post:

```html
<article class="post">
    <div class="post-date">February 3, 2026</div>
    <h2 class="post-title"><a href="posts/your-post.html">Your Post Title</a></h2>
    <p class="post-excerpt">
        A brief excerpt of your post...
    </p>
    <div class="post-tags">
        <span class="tag">algorithms</span>
        <span class="tag">research</span>
    </div>
</article>
```
