import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FormField } from '@/components/shared/FormField';
import { apiClient } from '@/lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Quên mật khẩu</CardTitle>
        <CardDescription>Nhập email để nhận hướng dẫn khôi phục mật khẩu</CardDescription>
      </CardHeader>

      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-center py-2">
            <Alert tier="success">
              Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.
            </Alert>
            <Link to="/login">
              <Button variant="outline" className="w-full mt-2">
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email trường" required>
              <Input
                type="email"
                placeholder="vd: student@fpt.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <Button type="submit" loading={loading} className="w-full">
              Gửi yêu cầu
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-neutral-100 py-3 text-xs text-neutral-500">
        Nhớ lại mật khẩu?{' '}
        <Link to="/login" className="text-brand-600 font-semibold ml-1 hover:underline">
          Đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
