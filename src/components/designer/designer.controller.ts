import { Request, Response } from 'express';
import httpStatus from 'http-status';
import logger from '@core/utils/logger';
import { designer } from '@components/designer/designer.model';
import { user } from '@components/user/user.model';
import { product } from '@components/product/product.model';
import { sendEmailMiddleware } from '@core/middlewares/nodemailer';
import { IUser } from '@components/user/user.interface';
import { IDesigner } from './designer.interface';

const requestDesigner = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const subject = 'Designer Profile Creation Request';
  const text = ' Please wait while we review your profile';

  try {
    const checkUser: any = await user.findById(userId);
    const email = `${checkUser.email}`;
    console.log(checkUser);
    if (checkUser.isDesigner) {
      return res
        .status(201)
        .send({ message: 'User is already a registered Designer ' });
    }
    // eslint-disable-next-line new-cap
    const newDesigner = new designer({ userId });
    checkUser.isDesigner = true;
    await checkUser.save();
    await newDesigner.save();
    return sendEmailMiddleware(req, res, email, subject, text);
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    return res.send({ message: 'Server Error', err });
  }
};

// const createProduct = async (req: Request, res: Response) => {
//   const { designerId } = req.body.userId;

//   try {
//     const checkUser: IDesigner = await designer.findById(designerId);
//     if (checkUser.isApproved) {
//       return res
//         .status(201)
//         .send({ message: 'User is already a registered Designer ' });
//     }
//     // eslint-disable-next-line new-cap
//     const newDesigner = new designer({ userId });
//     await newDesigner.save();
//     return res.status(201).send({ message: 'Designer n' });
//   } catch (err) {
//     res.status(httpStatus.INTERNAL_SERVER_ERROR);
//     return res.send({ message: 'Server Error' });
//   }
// };

// eslint-disable-next-line import/prefer-default-export
export { requestDesigner };
