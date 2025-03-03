import { Button } from "@/components/ui/button";

export default async function Home() {

  const products = await getAllProducts();

  return (
    <html>
      <body>
        <div>
          Hello World!
        </div>
        <Button>Click Me!</Button>
      </body>
    </html>

  );
}
