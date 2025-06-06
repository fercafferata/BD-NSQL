import mongoose from "mongoose"

const heroSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    realName: {
      type: String,
      trim: true,
    },
    yearOfAppearance: {
      type: Number,
      required: true,
    },
    publisher: {
      type: String,
      required: true,
      enum: ["marvel", "dc"],
      lowercase: true,
    },
    biography: {
      type: String,
      required: true,
    },
    equipment: {
      type: String,
    },
    images: {
      type: [String],
      validate: {
        validator: (v) => v.length > 0,
        message: "Al menos una imagen es requerida",
      },
    },
  },
  {
    timestamps: true,
  },
)

const Hero = mongoose.model("Hero", heroSchema)

export default Hero
