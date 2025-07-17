"use client";
import { useForm } from "react-hook-form";
import { zodResolved } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/ui";
import { useWriteContract } from "wagmi";
import { wagmiAbi } from "@/lib/abi";
import { PREDICTION_MARKET_ADDRESS } from "@/lib/constants";
import { queryClient } from "@/components/Providers";

