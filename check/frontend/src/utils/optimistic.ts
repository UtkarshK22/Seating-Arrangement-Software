import { toast } from "react-hot-toast";

type OptimisticAction<T> = {
  optimistic: () => void;
  rollback: () => void;
  request: () => Promise<T>;
  successMessage?: string;
  errorMessage?: string;
};

export async function runOptimistic<T>({
  optimistic,
  rollback,
  request,
  successMessage,
  errorMessage,
}: OptimisticAction<T>) {
  try {
    optimistic();
    const result = await request();
    if (successMessage) toast.success(successMessage);
    return result;
  } catch (err) {
    rollback();
    if (errorMessage) toast.error(errorMessage);
    throw err;
  }
}
