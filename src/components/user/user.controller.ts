import { Request, Response } from 'express';
import { get, controller, use } from '@core/decoraters';
import logger from '@core/utils/logger';

function message(): void {
  logger.debug('A Request was made');
}

@controller('/auth')
class LoginController {
  // eslint-disable-next-line class-methods-use-this
  @get('/login')
  @use(message)
  getLogin(req: Request, res: Response): void {
    res.send(`
            <form method="POST">
              <div>
                <label>Email</label>
                <input name="email" />
              </div>
              <div>
                <label>Password</label>
                <input name="e" type="password" />
              </div>
              <button>Submit</button>
            </form>
          `);
  }
}

export default LoginController;
