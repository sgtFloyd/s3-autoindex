Create nice directory listings for s3 buckets using only javascript and HTML.

The listing can be deployed on any site and can also be deployed into a bucket.

## Live Demo

If you want to see an example of this script in action check out:

<http://sgtfloyd.com/s3-books>

## Usage

Clone the respository and edit [index.html file][index], configuring it with your bucket.

[index]: https://github.com/sgtFloyd/s3-books/blob/gh-pages/index.html#L41

### Tips for S3 buckets

* Clone the respository to the root of your S3 bucket
* Turn on website mode for your S3 bucket.
* Configure the Bucket URL, *see below*.

### Configuring the Bucket to List

Set the `window.BUCKET_URL` javascript variable, e.g.:

    window.S3_BUCKET_URL='http://s3-books.s3.amazonaws.com/';

### S3 Buckets

You have to set the `window.BUCKET_URL` variable to be the S3 bucket endpoint
which *differs* from the website S3 bucket endpoint. For more details see:

<http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html#WebsiteRestEndpointDiff>

A specific example for the EU west region:

* Website endpoint: http://example-bucket.s3-website-eu-west-1.amazonaws.com/
* S3 bucket endpoint (for RESTful calls): http://example-bucket.s3-eu-west-1.amazonaws.com/

#### S3 Bucket Permissions

You must setup the S3 website bucket to allow public read access. 

* Grant `Everyone` the `List` and `View` permissions:
![List & View permissions(https://f.cloud.github.com/assets/227505/2409362/46c90dbe-aaad-11e3-9dee-10e967763770.png) 
* Assign the following bucket policy:
```
{
    "Version": "2008-10-17",
    "Statement": [
        {
            "Sid": "AllowPublicRead",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::{your-bucket-name}/*"
        }
    ]
}
```
* Assign the following CORS policy
```
<CORSConfiguration>
 <CORSRule>
   <AllowedOrigin>*</AllowedOrigin>
   <AllowedMethod>GET</AllowedMethod>
   <AllowedHeader>*</AllowedHeader>
 </CORSRule>
</CORSConfiguration>
```

## Copyright and License

Copyright 2012-2013 Rufus Pollock.

Licensed under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

