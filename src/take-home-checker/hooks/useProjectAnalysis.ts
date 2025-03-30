import { useQuery } from "@tanstack/react-query";

interface AnalysisData {
  content: string;
  analysis: {
    grade: "A" | "B" | "C" | "D";
    summary: string;
    redFlags: string[];
    yellowFlags: string[];
    greenFlags: string[];
  }
}

async function fetchProjectAnalysis(
  repoName: string,
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  },
  token: string): Promise<AnalysisData> {
  const response = await fetch("/api/analyze/project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo: repoName, owner, token }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Error analyzing project");
  }

  return response.json();
}

export function useProjectAnalysis(
  selectedRepo: {
    name: string;
    owner: {
      login: string;
      avatar_url: string;
      html_url: string;
    }
  } | null,
  token: string
) {
  const queryKey = ["projectAnalysis", selectedRepo?.name, selectedRepo?.owner, token];

  const {
    data,
    error,
    isError,
    isLoading,
    isSuccess,
    refetch,
    status,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!selectedRepo) return null;
      return fetchProjectAnalysis(selectedRepo.name, selectedRepo.owner, token);
    },
    enabled: false,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    error,
    isError,
    isLoading,
    isSuccess,
    refetch,
    status,
  };
}
