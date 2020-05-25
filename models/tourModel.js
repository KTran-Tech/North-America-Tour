const mongoose = require('mongoose');
// A slug is a unique identifier for the resource of the url
const slugify = require('slugify');
//schema(outline/model)
//specify a schema for our data
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      //unique will cause an error if we have a duplicate name
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal then 10 characters',
      ],
      minlength: [
        10,
        'A tour name must have more or equal then 40 characters',
      ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [
        true,
        'A tour must have a duration',
      ],
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        'A tour must have a group size',
      ],
    },
    difficulty: {
      type: String,
      required: [
        true,
        'A tour must have difficulty',
      ],
      //this is only for string
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: Number,
    summary: {
      type: String,
      trim: true,
      required: [
        true,
        'A tour must have a description',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [
        true,
        'A tour must have a cover image',
      ],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      //this means that this will never be displayed to the user
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//this is adding on a virtual type with extra data to the tourSchema
//Here we can do the calculation right in the model itself
tourSchema
  .virtual('durationWeeks')
  .get(function () {
    //if you wnat to use the "this" keyword then always use the normal function
    return this.duration / 7;
  });

//DOCUMENT MIDDLEWARE, 'pre' means to happen before saving the document
//'this' selects the current document, e.g a new document submitted to the database by user(.create() and .save() only)
//Note, only this regular function can you use 'this'
tourSchema.pre('save', function (next) {
  //'this.name' is based on the schema name
  //this.slug pointing to the currently being saved document
  this.slug = slugify(this.name, { lower: true });
  next();
});
//DOCUMENT MIDDLEWARE, 'post' means to happen after saving the document
// tourSchema.post('save', function (doc, next) {});

//

//

//

// QUERY MIDDLEWARE
//'find' pointing to the current query
// /^find/ mean anything that starts with 'find'
tourSchema.pre(/^find/, function (next) {
  //Display only the SectretTours that are not set to 'true' and dont display
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    `Query took ${
      Date.now() - this.start
    } milliseconds!`
  );
  next();
});

//AGGREGATION MIDDLEWARE
//points to aggregation object
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } },
  });
  console.log(this.pipeline());

  next();
});

//collection name and schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
