import { useQuery } from '@tanstack/react-query';
import Carousel from "./components/Carousel";

const App = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['allImages'],
    queryFn: () =>
      fetch(`https://rickandmortyapi.com/api/character`).then((res) =>
        res.json()
      ),
  })

  const pictures = data?.results?.map((result: any) => result?.image);

  if (isPending) return <p className="flex justify-center text-lg mt-6">Loading...</p>;

  if (isError) return <p className="flex justify-center text-lg mt-6">An error has occurred</p>;

  return (
    <div className="flex justify-center items-center h-screen bg-alien-green">
      <div className="w-[400px] h-[400px] border rounded-lg shadow-lg overflow-hidden flex justify-center items-center">
        <Carousel pictures={pictures} />
      </div>
    </div>
  );
};

export default App;

