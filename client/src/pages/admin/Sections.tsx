import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from '@/components/ui/loader';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Section } from '@/types';
import { api } from '@/lib/api';
import { Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/pagination-control';

const Sections: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  React.useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const data = await api.getSections();
      setSections(data);
    } catch (error) {
      toast({ title: 'Error loading sections', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (section: Section) => {
    try {
      const updated = { ...section, isActive: !section.isActive };
      await api.updateSection(section.id, updated);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? updated : s))
      );
      toast({ title: 'Section status updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating section', variant: 'destructive' });
    }
  };

  const handleToggleShowOnHome = async (section: Section) => {
    try {
      const updated = { ...section, showOnHome: !section.showOnHome };
      await api.updateSection(section.id, updated);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? updated : s))
      );
      toast({ title: 'Section visibility updated', variant: 'success' });
    } catch (error) {
      toast({ title: 'Error updating section', variant: 'destructive' });
    }
  };

  // Pagination logic
  const totalItems = sections.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedSections = sections.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <Loader fullScreen />;

  return (
    <AdminLayout title="Sections" breadcrumbs={[{ label: 'Sections' }]}>
      <p className="text-muted-foreground mb-6">
        Sections are predefined areas on the website. You can edit their settings but cannot delete them.
      </p>

      {/* Sections Table */}
      <div className="admin-card overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Icon</th>
                <th>Order</th>
                <th>Active</th>
                <th>Show on Home</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSections.map((section) => (
                <tr key={section.id}>
                  <td className="font-medium">{section.name}</td>

                  <td className="text-muted-foreground">{section.icon}</td>
                  <td className="text-muted-foreground">{section.order}</td>
                  <td>
                    <Switch
                      checked={section.isActive}
                      onCheckedChange={() => handleToggleActive(section)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <Switch
                      checked={section.showOnHome}
                      onCheckedChange={() => handleToggleShowOnHome(section)}
                      className="scale-75"
                    />
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => navigate(`/admin/sections/${section.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          totalItems={totalItems}
        />
      </div>
    </AdminLayout>
  );
};

export default Sections;
