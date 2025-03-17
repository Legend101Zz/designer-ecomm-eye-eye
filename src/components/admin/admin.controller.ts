import { Request, Response } from 'express';
import logger from '@core/utils/logger';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { product } from '@components/product/product.model';
import bcrypt from 'bcrypt';
import { designer } from '@components/designer/designer.model';
import { design } from '@components/design/design.model';
import { admin } from './admin.model';

interface CustomRequest extends Request {
  files: any; // Include the 'file' property with the MulterFile type
}

// Helper function to send design verification email
const sendDesignVerificationEmail = async (designData) => {
  const subject = 'Your Design Has Been Verified - Deauth';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #292929;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #292929;
          color: white;
          text-align: center;
          padding: 30px 20px;
          border-radius: 12px 12px 0 0;
        }
        .logo {
          width: 180px;
          height: auto;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #ffffff;
        }
        .content {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .design-image-container {
          text-align: center;
          margin: 20px 0;
        }
        .design-image {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .success-box {
          background-color: #f0fff4;
          border-left: 4px solid #48bb78;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .success-box h3 {
          color: #48bb78;
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .details {
          background-color: #f9f9f9;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .details h3 {
          color: #292929;
          margin: 0 0 15px 0;
        }
        .steps {
          background-color: #292929;
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .steps h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 10px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #ff7d04;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
          text-align: center;
        }
        .contact {
          background-color: #fff9f0;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
        }
        .contact a {
          color: #ff7d04;
          text-decoration: none;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          color: #666666;
          font-size: 12px;
          border-top: 1px solid #eeeeee;
        }
        .footer a {
          color: #ff7d04;
          text-decoration: none;
          margin: 0 10px;
        }
        .highlight {
          color: #ff7d04;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.deauth.in/_next/image?url=%2FDeauth-Logo.png&w=256&q=75" alt="Deauth Logo" class="logo">
          <h1>Your Design Has Been Verified!</h1>
        </div>
        
        <div class="content">
          <p>Hello <span class="highlight">${
            designData.designer.artistName || designData.designer.fullname
          }</span>,</p>
          
          <div class="success-box">
            <h3>✅ Design Approved and Live</h3>
            <p>Great news! Your design "<span class="highlight">${
              designData.title
            }</span>" has been verified and is now live on Deauth.</p>
          </div>
          
          <div class="design-image-container">
            <img src="${designData.designImage[0]?.url}" alt="${
    designData.title
  }" class="design-image">
          </div>
          
          <div class="details">
            <h3>Design Details</h3>
            <ul>
              <li><strong>Title:</strong> ${designData.title}</li>
              <li><strong>Description:</strong> ${
                designData.description || 'No description provided'
              }</li>
              <li><strong>Date Approved:</strong> ${new Date().toDateString()}</li>
            </ul>
          </div>

          <div class="steps">
            <h3>What's Next</h3>
            <ol>
              <li>Create products using your verified design</li>
              <li>Set pricing for your products</li>
              <li>Share your creations on social media</li>
              <li>Track your sales and earnings</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="https://deauth.in/profile/DesignerDashboard" class="cta-button">Manage Your Designs</a>
          </div>

          <div class="contact">
            <p>Need assistance with your designs?</p>
            <a href="mailto:designer.support@deauth.in">designer.support@deauth.in</a>
          </div>
        
          <div class="footer">
            <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
            <div>
              <a href="https://deauth.in/privacy">Privacy Policy</a> | 
              <a href="https://deauth.in/terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const textContent = `
Your Design Has Been Verified - Deauth

Hello ${designData.designer.artistName || designData.designer.fullname},

Great news! Your design "${
    designData.title
  }" has been verified and is now live on Deauth.

Design Details:
- Title: ${designData.title}
- Description: ${designData.description || 'No description provided'}
- Date Approved: ${new Date().toDateString()}

What's Next:
1. Create products using your verified design
2. Set pricing for your products
3. Share your creations on social media
4. Track your sales and earnings

Manage your designs at: https://deauth.in/profile/DesignerDashboard

Need assistance with your designs?
designer.support@deauth.in

© ${new Date().getFullYear()} Deauth. All rights reserved.
  `;

  await sendEmailMiddleware(
    null,
    null,
    designData.designer.userId.email,
    subject,
    htmlContent,
    textContent,
  );
};

// Helper function to send designer approval email
const sendDesignerApprovalEmail = async (designerData) => {
  const subject =
    'Congratulations! Your Designer Application Has Been Approved - Deauth';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #292929;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #292929;
          color: white;
          text-align: center;
          padding: 30px 20px;
          border-radius: 12px 12px 0 0;
        }
        .logo {
          width: 180px;
          height: auto;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #ffffff;
        }
        .content {
          background-color: #ffffff;
          padding: 40px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .success-box {
          background-color: #f0fff4;
          border-left: 4px solid #48bb78;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .success-box h3 {
          color: #48bb78;
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .details {
          background-color: #f9f9f9;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .details h3 {
          color: #292929;
          margin: 0 0 15px 0;
        }
        .steps {
          background-color: #292929;
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .steps h3 {
          color: #ff7d04;
          margin: 0 0 15px 0;
        }
        .steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 10px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #ff7d04;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
          text-align: center;
        }
        .contact {
          background-color: #fff9f0;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 25px 0;
        }
        .contact a {
          color: #ff7d04;
          text-decoration: none;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          color: #666666;
          font-size: 12px;
          border-top: 1px solid #eeeeee;
        }
        .footer a {
          color: #ff7d04;
          text-decoration: none;
          margin: 0 10px;
        }
        .highlight {
          color: #ff7d04;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://www.deauth.in/_next/image?url=%2FDeauth-Logo.png&w=256&q=75" alt="Deauth Logo" class="logo">
          <h1>Designer Application Approved!</h1>
        </div>
        
        <div class="content">
          <p>Hello <span class="highlight">${
            designerData.artistName || designerData.fullname
          }</span>,</p>
          
          <div class="success-box">
            <h3>🎉 Congratulations! You're now a Deauth Designer</h3>
            <p>We're thrilled to inform you that your application to join Deauth as a designer has been approved! Welcome to our creative community.</p>
          </div>
          
          <div class="steps">
            <h3>What's Next</h3>
            <ol>
              <li>Log in to your designer dashboard</li>
              <li>Upload your first design to start selling</li>
              <li>Set up your payout preferences</li>
              <li>Promote your designs to increase visibility</li>
            </ol>
          </div>

          <div style="text-align: center;">
            <a href="https://deauth.in/profile/DesignerDashboard" class="cta-button">Go to Designer Dashboard</a>
          </div>

          <div class="details">
            <h3>Your Designer Benefits</h3>
            <ul>
              <li>Competitive commission rates on every sale</li>
              <li>Access to our design tools and resources</li>
              <li>Exposure to our growing customer base</li>
              <li>Support from our dedicated designer team</li>
            </ul>
          </div>

          <div class="contact">
            <p>Questions about getting started? We're here to help!</p>
            <a href="mailto:designer.support@deauth.in">designer.support@deauth.in</a>
          </div>
        
          <div class="footer">
            <p>© ${new Date().getFullYear()} Deauth. All rights reserved.</p>
            <div>
              <a href="https://deauth.in/privacy">Privacy Policy</a> | 
              <a href="https://deauth.in/terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const textContent = `
Congratulations! Your Designer Application Has Been Approved - Deauth

Hello ${designerData.artistName || designerData.fullname},

We're thrilled to inform you that your application to join Deauth as a designer has been approved! Welcome to our creative community.

What's Next:
1. Log in to your designer dashboard
2. Upload your first design to start selling
3. Set up your payout preferences
4. Promote your designs to increase visibility

Visit your dashboard at: https://deauth.in/profile/DesignerDashboard

Your Designer Benefits:
- Competitive commission rates on every sale
- Access to our design tools and resources
- Exposure to our growing customer base
- Support from our dedicated designer team

Questions about getting started? We're here to help!
designer.support@deauth.in

© ${new Date().getFullYear()} Deauth. All rights reserved.
  `;

  await sendEmailMiddleware(
    null,
    null,
    designerData.userId.email,
    subject,
    htmlContent,
    textContent,
  );
};

// creating a admin

const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if an admin with the same email already exists
    const existingAdmin = await admin.findOne({ email });

    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: 'Admin with this email already exists' });
    }

    // Hash the password before saving it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // eslint-disable-next-line new-cap
    const newAdmin = new admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    return res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while creating the admin' });
  }
};

// login admin

const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find the admin by email
    const foundAdmin = await admin.findOne({ email });

    if (!foundAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      foundAdmin.password as string,
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    return res.status(200).json({ message: 'Admin logged in successfully' });
  } catch (error) {
    logger.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while logging in' });
  }
};

// add product

const addProduct = async (req: CustomRequest, res: Response) => {
  try {
    // Retrieve form data from req.body and req.file
    const { name, quantity, category, color } = req.body;

    const images = req.files;

    const updatedImages = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const image of images) {
      updatedImages.push({ url: image.path, filename: image.filename });
    }

    // Create a new product using the Product model
    // eslint-disable-next-line new-cap
    const newProduct = new product({
      name,
      quantity,
      category,
      color: [color],
      image: updatedImages,
    });

    // Save the product to the database
    await newProduct.save();

    res.send('Product added'); // Redirect to the product list page
  } catch (error) {
    logger.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const products = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const { search, category } = req.query;

    // Construct the filter object based on query parameters
    const filter: any = {};
    if (search) {
      // @ts-ignore
      filter.name = { $regex: new RegExp(search, 'i') };
    }
    if (category) {
      filter.category = category;
    }

    // Fetch filtered products from the database
    const prod = await product.find(filter);

    // Render the page with the filtered products
    res.render('products', { products: prod });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const renderEditProductPage = async (req: Request, res: Response) => {
  try {
    // Extract the product ID from the route parameters
    const { productId } = req.params;

    const prod = await product.findById(productId);

    if (!prod) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.render('editProd', {
      title: 'Edit Product',
      productId,
      prod,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const editProduct = async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    const updatedProduct = await product.findByIdAndUpdate(
      productId,
      { quantity },
      { new: true },
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.redirect('/api/admin/products');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
// ============ DESIGNER ============
const allDesigners = async (req: Request, res: Response) => {
  try {
    // Fetch approved designers with populated designs
    const approvedDesigners = await designer
      .find({ isApproved: true })
      .populate({
        path: 'Designs',
        select: 'title description designImage isVerified',
      });

    // Fetch non-approved designers
    const notApprovedDesigners = await designer
      .find({
        isApproved: false,
      })
      .populate({
        path: 'Designs',
        select: 'title description designImage isVerified',
      });

    // Fetch unverified designs with designer information
    const designs = await design
      .find({ isVerified: false })
      .select('title description designImage')
      .populate({
        path: 'designer',
        select: 'artistName fullname profileImage',
      });

    // Log counts for debugging
    console.log(`Found ${approvedDesigners.length} approved designers`);
    console.log(`Found ${notApprovedDesigners.length} pending designers`);
    console.log(`Found ${designs.length} pending designs`);

    // Render the page with the fetched data
    res.render('designer', {
      designs: designs || [],
      approvedDesigners: approvedDesigners || [],
      notApprovedDesigners: notApprovedDesigners || [],
    });
  } catch (e) {
    console.error('Error in allDesigners:', e);
    logger.error(e);
    res
      .status(500)
      .send(`Internal Server Error: ${e.message || 'Unknown error'}`);
  }
};

const getDesignerDetails = async (req: Request, res: Response) => {
  try {
    const designer1 = await designer.findById(req.params.id);

    if (!designer1) {
      return res.status(404).send(' heeeh');
    }

    return res.render('designerSingle', { designer: designer1 });
  } catch (e) {
    logger.error(e);
    return res.status(500).send('Internal Server Error');
  }
};

const approveDesignerController = async (req: Request, res: Response) => {
  try {
    const { designerId } = req.params;

    // Find the designer by ID and update the 'isApproved' field to true
    const updatedDesigner = await designer
      .findByIdAndUpdate(designerId, { isApproved: true }, { new: true })
      .populate('userId'); // Populate to get user info for email

    if (!updatedDesigner) {
      return res.status(404).json({ error: 'Designer not found' });
    }

    // Send approval email notification
    // @ts-ignore
    const userEmail = updatedDesigner.userId.email;
    await sendDesignerApprovalEmail(updatedDesigner);

    return res.redirect('/api/admin/designer');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

const verifyDesignController = async (req: Request, res: Response) => {
  const { designId } = req.params;

  try {
    // Find the design by ID
    const foundDesign = await design.findById(designId).populate({
      path: 'designer',
      populate: {
        path: 'userId',
        select: 'email',
      },
    });

    if (!foundDesign) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Update the 'isVerified' field to true
    foundDesign.isVerified = true;

    // Save the updated design
    await foundDesign.save();

    // Send design verification email
    await sendDesignVerificationEmail(foundDesign);

    // Respond with a success message or the updated design
    return res.redirect('/api/admin/designer');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// eslint-disable-next-line import/prefer-default-export
export {
  createAdmin,
  loginAdmin,
  addProduct,
  products,
  renderEditProductPage,
  editProduct,
  allDesigners,
  getDesignerDetails,
  approveDesignerController,
  verifyDesignController,
};
