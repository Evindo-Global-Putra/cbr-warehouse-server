import { CompanyRepository } from "../repositories/company.repository";
import { companies } from "../db/schema";

type Company = typeof companies.$inferSelect;
type NewCompany = typeof companies.$inferInsert;
type UpdateCompany = Partial<Omit<NewCompany, "id" | "createdAt" | "updatedAt">>;

export class CompanyService {
  constructor(private companyRepo: CompanyRepository) {}

  async getAll(): Promise<Company[]> {
    return this.companyRepo.findAll();
  }

  async getById(id: number): Promise<Company> {
    const company = await this.companyRepo.findById(id);
    if (!company) throw new Error(`Company with id ${id} not found`);
    return company;
  }

  async getByNpwp(npwp: string): Promise<Company> {
    const company = await this.companyRepo.findByNpwp(npwp);
    if (!company) throw new Error(`Company with NPWP "${npwp}" not found`);
    return company;
  }

  async search(name: string): Promise<Company[]> {
    return this.companyRepo.findByName(name);
  }

  async getByCountry(country: string): Promise<Company[]> {
    return this.companyRepo.findByCountry(country);
  }

  async create(data: NewCompany): Promise<Company> {
    if (data.npwp) {
      const existing = await this.companyRepo.findByNpwp(data.npwp);
      if (existing) throw new Error(`Company with NPWP "${data.npwp}" already exists`);
    }
    return this.companyRepo.create(data);
  }

  async update(id: number, data: UpdateCompany): Promise<Company> {
    await this.getById(id);

    if (data.npwp) {
      const existing = await this.companyRepo.findByNpwp(data.npwp);
      if (existing && existing.id !== id) {
        throw new Error(`NPWP "${data.npwp}" is already registered to another company`);
      }
    }

    const updated = await this.companyRepo.update(id, data);
    if (!updated) throw new Error(`Failed to update company with id ${id}`);
    return updated;
  }

  async delete(id: number): Promise<Company> {
    await this.getById(id);
    const deleted = await this.companyRepo.delete(id);
    if (!deleted) throw new Error(`Failed to delete company with id ${id}`);
    return deleted;
  }
}
