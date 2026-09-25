import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ChevronDown, Mail, HelpCircle, LifeBuoy } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { SearchInput } from '@/components/shared/SearchInput';
import { Card } from '@/components/ui/Card';
import { faqList, faqCategories, type FaqItem } from '@/content/faq';

export const HelpPage: React.FC = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Open hash anchor if present
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setOpenItems((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [location.hash]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const q = search.trim().toLowerCase();
  const filteredFaqs = faqList.filter(
    (item) => !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Trung tâm trợ giúp"
        description="Giải đáp các câu hỏi thường gặp về quy tắc học vụ, tính năng đổi lớp, xét duyệt CLB và thuật toán AI."
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Tìm kiếm câu hỏi theo từ khóa (vd: đổi lớp, email, kiểm duyệt...)"
        className="max-w-xl"
      />

      <div className="space-y-8">
        {faqCategories.map((cat) => {
          const itemsInCat = filteredFaqs.filter((f) => f.category === cat.key);
          if (itemsInCat.length === 0) return null;

          return (
            <section key={cat.key} className="space-y-3">
              <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-200 pb-2">
                {cat.label}
              </h2>

              <div className="space-y-3">
                {itemsInCat.map((item) => {
                  const isOpen = !!openItems[item.id];
                  return (
                    <div
                      key={item.id}
                      id={item.id}
                      className="rounded-xl border border-neutral-200 bg-white transition-all overflow-hidden scroll-mt-24"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-neutral-900 hover:text-brand-600 transition-colors cursor-pointer"
                      >
                        <span>{item.question}</span>
                        <ChevronDown
                          size={16}
                          className={`text-neutral-400 transition-transform ${
                            isOpen ? 'rotate-180 text-brand-600' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {filteredFaqs.length === 0 && (
          <Card className="p-8 text-center space-y-2">
            <HelpCircle size={32} className="mx-auto text-neutral-400" />
            <p className="text-sm font-semibold text-neutral-800">
              Không tìm thấy câu hỏi phù hợp với “{search}”
            </p>
            <p className="text-xs text-neutral-500">
              Vui lòng thử từ khóa khác hoặc liên hệ trực tiếp với ban quản trị.
            </p>
          </Card>
        )}
      </div>

      {/* Support Contact Footer */}
      <Card className="p-6 bg-brand-50/50 border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900">Vẫn chưa tìm được câu trả lời?</h3>
            <p className="text-[11px] text-neutral-600">
              Đội ngũ quản trị viên và hỗ trợ kỹ thuật sẵn sàng giải đáp thắc mắc của bạn.
            </p>
          </div>
        </div>
        <a
          href="mailto:support@scs.edu.vn"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
        >
          <Mail size={14} /> support@scs.edu.vn
        </a>
      </Card>
    </div>
  );
};

export default HelpPage;
