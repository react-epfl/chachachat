var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var achievementSchema = new Schema({
  type: String,
  tier: Number
});

achievementSchema.methods.toJSON = function() {
  return {
    type: this.type,
    tier: this.tier
  };
};

var Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = {
  schema: achievementSchema,
  model: Achievement
};
