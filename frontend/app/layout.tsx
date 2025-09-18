import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ApolloProviderWrapper } from '@/lib/apollo-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Eufy GEO Platform - 关键词管理平台',
  description: 'Eufy 智能家居 AI 生成搜索引擎优化（GEO）项目管理平台',
  keywords: ['Eufy', 'GEO', 'SEO', '关键词管理', 'AI优化'],
  authors: [{ name: 'Eufy GEO Team' }],
  robots: 'noindex, nofollow', // 内部平台，不被搜索引擎索引
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ApolloProviderWrapper>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#3b82f6',
                colorSuccess: '#10b981',
                colorWarning: '#f59e0b',
                colorError: '#ef4444',
                colorInfo: '#3b82f6',
                borderRadius: 6,
                fontFamily: inter.style.fontFamily,
              },
              components: {
                Button: {
                  borderRadius: 6,
                  controlHeight: 36,
                },
                Input: {
                  borderRadius: 6,
                  controlHeight: 36,
                },
                Select: {
                  borderRadius: 6,
                  controlHeight: 36,
                },
                Table: {
                  borderRadius: 6,
                  headerBg: '#f9fafb',
                  headerColor: '#374151',
                  headerSortActiveBg: '#f3f4f6',
                  headerSortHoverBg: '#f9fafb',
                  rowHoverBg: '#eff6ff',
                  rowSelectedBg: '#dbeafe',
                  rowSelectedHoverBg: '#bfdbfe',
                },
                Card: {
                  borderRadius: 8,
                  headerBg: '#f9fafb',
                },
                Form: {
                  labelColor: '#374151',
                  labelFontSize: 14,
                },
                Typography: {
                  titleMarginTop: 0,
                  titleMarginBottom: 16,
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}