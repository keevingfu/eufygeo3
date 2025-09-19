'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/dashboard', label: '仪表板', icon: '📊' },
    { href: '/dashboard/keywords', label: '关键词管理', icon: '🔍' },
    { href: '/dashboard/content', label: '内容管理', icon: '📝' },
    { href: '/dashboard/analytics', label: '数据分析', icon: '📈' },
    { href: '/login', label: '登录', icon: '🔐' }
  ];

  return (
    <nav style={{
      backgroundColor: '#001529',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          color: '#fff', 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          marginRight: 'auto'
        }}>
          Eufy GEO Platform
        </div>
        
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              color: pathname === item.href ? '#1890ff' : '#fff',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: pathname === item.href ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      
      {/* 移动端响应式菜单 (简化版) */}
      <style jsx global>{`
        @media (max-width: 768px) {
          nav > div {
            flex-direction: column;
            gap: 1rem;
          }
          nav > div > div:first-child {
            margin-right: 0;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </nav>
  );
}