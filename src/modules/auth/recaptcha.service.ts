import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class RecaptchaService {
  async verify(token: string): Promise<boolean> {
    try {
      const response = await axios.post<{ success: boolean }>(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      );
      return response.data.success;
    } catch (error) {
      console.error('reCAPTCHA verification failed:', error);
      return false;
    }
  }
}
