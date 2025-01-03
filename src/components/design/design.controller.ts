import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { product } from '@components/product/product.model';
import { design } from './design.model';

// interface CustomRequest extends Request {
//   files: any; // Include the 'file' property with the MulterFile type
// }
const showDesigns = async (req: Request, res: Response) => {
  try {
    // Fetch all designs
    const allDesigns = await design
      .find()
      .populate('designer', 'legal_first_name legal_last_name')
      .exec();

    // If there are no designs, return an empty array
    if (!allDesigns) {
      return res.status(200).json([]);
    }

    // Iterate over each design and replace missing fields with empty strings
    const designsWithEmptyFields = allDesigns.map((design1) => {
      return {
        title: design1.title || '',
        description: design1.description || '',
        designImage: design1.designImage || [],
        designer: design1.designer || {
          legal_first_name: '',
          legal_last_name: '',
        }, // Assuming designer is always populated
        finalProduct: design1.finalProduct || [],
        isVerified: design1.isVerified || false,
      };
    });

    return res.status(200).json(designsWithEmptyFields);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// =========OF NO USE CURRENTLY ============
// controller for updating a design
const updateDesign = async (req: Request, res: Response) => {
  try {
    const { designId } = req.params; // Extract design ID from request params
    const { title, description, productIds } = req.body;

    // Find the design by ID
    const existingDesign = await design.findById(designId);

    if (!existingDesign) {
      return res.status(404).json({ message: 'Design not found' });
    }

    // Update the design fields if provided in the request
    if (title) {
      existingDesign.title = title;
    }
    if (description) {
      existingDesign.description = description;
    }
    if (productIds) {
      // Check if the products exist
      const existingProducts = await product.find({ _id: { $in: productIds } });

      if (existingProducts.length !== productIds.length) {
        return res.status(404).json({ message: 'Some products not found' });
      }
      // @ts-ignore
      existingDesign.product = productIds;
    }

    // Save the updated design
    const updatedDesign = await existingDesign.save();

    return res.status(200).json(updatedDesign);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getDesignerDesigns = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    const designs = await design
      .find({ designer: designerId })
      .populate('designer', 'name');

    if (!designs || designs.length === 0) {
      return res
        .status(404)
        .json({ error: 'Designer not found or has no designs.' });
    }

    // Extract relevant information from designs
    const formattedDesigns = designs.map((design1) => ({
      title: design1.title || '',
      description: design1.description || '',
      designer: design1.designer,
      designImages: design1.designImage.map((image) => ({
        url: image.url,
        filename: image.filename,
      })),
    }));

    return res.json(formattedDesigns);
  } catch (error) {
    logger.error('Error fetching designs:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getRandomDesigns = async (req: Request, res: Response) => {
  try {
    const count = await design.countDocuments({ isVerified: true });
    let randomDesigns = [];

    if (count <= 5) {
      // If we have 5 or fewer designs, return all of them
      randomDesigns = await design.aggregate([
        { $match: { isVerified: true } },
        { $sample: { size: count } },
        {
          $lookup: {
            from: 'designers',
            localField: 'designer',
            foreignField: '_id',
            as: 'designerInfo',
          },
        },
        { $unwind: '$designerInfo' },
        {
          $project: {
            designPhotoUrl: { $arrayElemAt: ['$designImage.url', 0] },
            designName: '$title',
            designerId: '$designer',
            designerName: '$designerInfo.artistName',
          },
        },
      ]);
    } else {
      // If we have more than 5 designs, get 5 random ones
      randomDesigns = await design.aggregate([
        { $match: { isVerified: true } },
        { $sample: { size: 5 } },
        {
          $lookup: {
            from: 'designers',
            localField: 'designer',
            foreignField: '_id',
            as: 'designerInfo',
          },
        },
        { $unwind: '$designerInfo' },
        {
          $project: {
            designPhotoUrl: { $arrayElemAt: ['$designImage.url', 0] },
            designName: '$title',
            designerId: '$designer',
            designerName: '$designerInfo.artistName',
          },
        },
      ]);
    }

    res.json(randomDesigns);
  } catch (error) {
    console.error('Error fetching random designs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to group image URLs by category and design id
// function groupImagesByCategoryAndDesign(images) {
//   const groupedImages = {};

//   images.forEach((image) => {
//     const { category, designId, images: imageArray } = image;

//     if (!groupedImages[category]) {
//       groupedImages[category] = {};
//     }

//     if (!groupedImages[category][designId]) {
//       groupedImages[category][designId] = { images: [] };
//     }

//     // Extract URLs from each image and add them to the array
//     const imageUrls = imageArray.map((img) => img.url);
//     groupedImages[category][designId].images.push(...imageUrls);
//   });

//   return groupedImages;
// }

// const getProducts = async (req: Request, res: Response) => {
//   try {
//     // Fetch all designs with associated products
//     const designs = await design.find().populate('product.productId');
//     console.log('designs', designs);
//     // Extract products from designs
//     const allProducts = designs.reduce((acc, design1) => {
//       // Extract products from the design and flatten the array
//       const designProducts = design1.product
//         .map((designProduct) => {
//           const { productId } = designProduct;
//           const { images } = designProduct;
//           console.log('designs', productId);
//           if (images.length > 0 && productId) {
//             return {
//               category: productId.category,
//               color: productId.color,
//               // eslint-disable-next-line no-underscore-dangle
//               designId: design1._id,
//               images,
//             };
//           }
//           return null;
//         })
//         .filter(Boolean);

//       acc.push(...designProducts);
//       return acc;
//     }, []);
//     console.log(allProducts);
//     // Group products by category
//     const groupedProducts = groupImagesByCategoryAndDesign(allProducts);

//     res.json(groupedProducts);
//   } catch (error) {
//     logger.error(error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// eslint-disable-next-line import/prefer-default-export
export { showDesigns, updateDesign, getDesignerDesigns, getRandomDesigns };
