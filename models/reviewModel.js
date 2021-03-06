const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0'],
    },
    //Tells you what tour the review belongs to
    tour: {
      //special referencing command
      //This expects the 'type' to be a MongoDB document object Id (basically userId)
      type: mongoose.Schema.ObjectId,
      //referencing tourModel, the name. e.g "const Tour = mongoose.model('Tour', tourSchema);" of the Tour Schema Model
      ref: 'Tour',
      required: [
        true,
        'Review must belong to a tour.',
      ],
    },
    //Tells you which user left the review
    user: {
      //This expects the 'type' to be a MongoDB document object Id (basically userId)
      type: mongoose.Schema.ObjectId,
      //referencing the userModel, the name e.g "const User = mongoose.model('User', userSchema);" of the User Schema Model
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  //Virtuals have additional attribute but it does not get inserted into DB. So this will make it visible to us in the output
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//

//Indexing to prevent duplicate Reviews
//User can only submit 1 review and it is unique meaning it can not be duplicate
reviewSchema.index(
  { tour: 1, user: 1 },
  { unique: true }
);

//

//PRE

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

//

//

//pass in specific tour Id given by user, this function will be called (below).
/*Note: The reason why we don't use catchAsync for these middleware
is because is the catchAsync function is only meant for Express Route
Handlers and are not pointing to our Schema document to begin with*/
reviewSchema.statics.calcAverageRatings = async function (
  tourId
) {
  //storing the calculation in "stats"
  const stats = await this.aggregate([
    {
      //not suppose to show in console.log
      //search and match that specific tour Id
      $match: { tour: tourId },
    },
    {
      $group: {
        //_id = "tour Id passed in by user"
        _id: '$tour',
        nRating: { $sum: 1 },
        //find the average rating of that tour
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
//After new review has been created, pass in tour Id data from the review
reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

//

//

//This is basically the same as:
//findByIdAndUpdate
//findByIdAndDelete
/* Before findOneAndUpdate()/Delete() reviews in database do... */
/*Note: The reason why we don't use catchAsync for these middleware
is because is the catchAsync function is only meant for Express Route
Handlers and are not pointing to our Schema document to begin with*/
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //This gets the current document/Schema passed in
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (
  next
) {
  //calculate ratings of the document tour review and update its average
  await this.r.constructor.calcAverageRatings(
    this.r.tour
  );
});

//

//

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
