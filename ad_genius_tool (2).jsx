import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Papa from "papaparse";
import saveAs from "file-saver";

export default function AdGeniusTool() {
  const [platform, setPlatform] = useState("facebook");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [pastData, setPastData] = useState("");
  const [output, setOutput] = useState("");
  const [savedCampaigns, setSavedCampaigns] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("adgenius_user");
    if (storedUser) setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    const userDB = JSON.parse(localStorage.getItem("adgenius_users")) || {};
    if (userDB[username] === password) {
      localStorage.setItem("adgenius_user", JSON.stringify({ username }));
      setAuthenticated(true);
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  const handleSignup = () => {
    const userDB = JSON.parse(localStorage.getItem("adgenius_users")) || {};
    if (userDB[username]) {
      alert("Username already exists.");
      return;
    }
    userDB[username] = password;
    localStorage.setItem("adgenius_users", JSON.stringify(userDB));
    localStorage.setItem("adgenius_user", JSON.stringify({ username }));
    setAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adgenius_user");
    setAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const insights = JSON.stringify(results.data.slice(0, 3));
        setPastData(insights);
      }
    });
  };

  const handleGenerate = async () => {
    const prompt = `Generate two high-converting ad copy variants for ${platform}.\n\nProduct: ${product}\nAudience: ${audience}\nPast Data: ${pastData}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_OPENAI_API_KEY`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const adCopy = data.choices[0].message.content;
    setOutput(adCopy);
    setSavedCampaigns([...savedCampaigns, { platform, product, audience, adCopy }]);
  };

  const handleExportCSV = () => {
    const csvContent = ["Platform,Product,Audience,Ad Copy", ...savedCampaigns.map(c => `"${c.platform}","${c.product}","${c.audience}","${c.adCopy.replace(/"/g, '""')}"`)].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "ad_campaigns.csv");
  };

  const handleShareableLink = (campaign) => {
    const data = encodeURIComponent(JSON.stringify(campaign));
    const link = `${window.location.origin}/share?data=${data}`;
    navigator.clipboard.writeText(link);
    alert("Shareable link copied to clipboard!");
  };

  if (!authenticated) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">{isSignup ? "Sign Up" : "Login"} to AdGenius</h1>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button onClick={isSignup ? handleSignup : handleLogin}>{isSignup ? "Sign Up" : "Login"}</Button>
        <Button variant="link" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Already have an account? Log in" : "Don't have an account? Sign up"}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">AdGenius - AI-Powered Ad Generator</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <Card className="mb-4">
        <CardContent className="space-y-4">
          <Tabs defaultValue="facebook" onValueChange={setPlatform}>
            <TabsList>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
            </TabsList>
            <TabsContent value="facebook" />
            <TabsContent value="google" />
            <TabsContent value="instagram" />
          </Tabs>
          <Input placeholder="Enter product or service" value={product} onChange={(e) => setProduct(e.target.value)} />
          <Input placeholder="Enter target audience (e.g., Gen Z women)" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <Textarea placeholder="Paste past campaign data or insights (optional)" value={pastData} onChange={(e) => setPastData(e.target.value)} />
          <Input type="file" accept=".csv" onChange={handleCSVUpload} />
          <Button onClick={handleGenerate}>Generate Ad Copy</Button>
          <Button variant="outline" onClick={handleExportCSV}>Export Campaigns to CSV</Button>
        </CardContent>
      </Card>
      {output && (
        <Card className="mb-4">
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{output}</pre>
          </CardContent>
        </Card>
      )}
      {savedCampaigns.length > 0 && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Saved Campaigns</h2>
            <ul className="space-y-2">
              {savedCampaigns.map((campaign, index) => (
                <li key={index} className="bg-gray-100 p-2 rounded">
                  <strong>{campaign.platform.toUpperCase()} - {campaign.product}</strong>
                  <div className="text-sm">Audience: {campaign.audience}</div>
                  <div className="text-xs mt-1 whitespace-pre-wrap">{campaign.adCopy}</div>
                  <Button size="sm" className="mt-2" onClick={() => handleShareableLink(campaign)}>
                    Copy Shareable Link
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
