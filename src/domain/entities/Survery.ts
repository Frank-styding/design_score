"use server";

export class Survey {
  id?: number;
  password?: string;
  title!: string;
  description!: string;
  adminId!: string;
  isActive!: boolean;
  constructor(params: {
    id?: number;
    password?: string;
    title: string;
    description: string;
    adminId: string;
    isActive: boolean;
  }) {
    this.id = params.id;
    this.password = params.password;
    this.title = params.title;
    this.description = params.description;
    this.adminId = params.adminId;
    this.isActive = params.isActive;
  }
}
