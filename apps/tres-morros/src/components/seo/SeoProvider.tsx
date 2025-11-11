"use client";

import { DefaultSeo } from "next-seo";
import { defaultSeoConfig } from "@/seo/config";

export const SeoProvider = () => <DefaultSeo {...defaultSeoConfig} />;
