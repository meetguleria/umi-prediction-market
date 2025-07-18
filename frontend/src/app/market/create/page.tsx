"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input } from "@/components/ui";
import { useWriteContract } from "wagmi";
import { wagmiAbi } from "@/lib/abi";
import { PREDICTION_MARKET_ADDRESS } from "@/lib/constants";
import  queryClient from "@/components/Providers";

const schema = z.object({
  question: z.string().min(10, "Ask a fuller question"),
  oracle: z.string().startsWith("0x").length(42),
  endTime: z.coerce.date().refine(d => d > new Date(), "End time in future"),
});
type FormValues = z.infer<typeof schema>;

export default function CreateMarketPage() {
  const { register, handleSubmit, formState: { errors }, reset }
        = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { writeContractAsync } = useWriteContract();

  async function onSubmit(values: FormValues) {
    // placeholder Card
    const tempId = crypto.randomUUID();
    queryClient.setQueryData(["markets"], (old: any=[]) => [
      ...old,
      { id: tempId, ...values, optimistic:true },
    ]);

    try {
      await writeContractAsync({
        address: PREDICTION_MARKET_ADDRESS as `0x${string}`,
        abi: wagmiAbi,
        functionName: "createMarket",
        args: [
          values.question,
          values.oracle,
          Math.floor(values.endTime.getTime() / 1000),
        ],
      });
    } finally {
      // requery from chain so optimistic row is reconciled
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      reset();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <Input placeholder="What will happen?" {...register("question")} />
      {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}

      <Input placeholder="Oracle address (0x…)" {...register("oracle")} />
      {errors.oracle && <p className="text-sm text-destructive">{errors.oracle.message}</p>}

      <Input type="datetime-local" {...register("endTime")} />
      {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}

      <Button type="submit" className="w-full">Create market</Button>
    </form>
  )
}